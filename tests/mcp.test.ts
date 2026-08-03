import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import type { JSONRPCMessage } from '@modelcontextprotocol/server';
import { InMemoryTransport } from '@modelcontextprotocol/server';
import { buildServer, SERVER_NAME, SERVER_VERSION } from '../src/server.js';

// 실제 SDK를 태워서 와이어에 나가는 것을 검증한다. tests/client.test.ts는 kakaoFetch만,
// tests/smoke.ts는 도구 콜백만 건드려서 둘 다 SDK 배선을 커버하지 못한다.
// SDK를 올릴 때 도구 등록/스키마 변환이 깨지면 여기서 잡힌다.

type Json = Record<string, unknown>;

/** 서버에 붙은 in-memory transport 위에서 raw JSON-RPC 요청/응답을 주고받는 최소 클라이언트. */
class TestClient {
  private nextId = 1;
  private readonly pending = new Map<number, (msg: Json) => void>();

  constructor(private readonly transport: InMemoryTransport) {
    transport.onmessage = (msg) => {
      const m = msg as Json;
      const resolve = typeof m.id === 'number' ? this.pending.get(m.id) : undefined;
      if (resolve) {
        this.pending.delete(m.id as number);
        resolve(m);
      }
    };
  }

  async request(method: string, params: Json = {}): Promise<Json> {
    const id = this.nextId++;
    const response = new Promise<Json>((resolve) => this.pending.set(id, resolve));
    await this.transport.send({ jsonrpc: '2.0', id, method, params } as JSONRPCMessage);
    return response;
  }

  async notify(method: string, params: Json = {}): Promise<void> {
    await this.transport.send({ jsonrpc: '2.0', method, params } as JSONRPCMessage);
  }
}

type ToolDef = {
  name: string;
  title?: string;
  description?: string;
  annotations?: Record<string, unknown>;
  inputSchema: {
    type: string;
    properties: Record<string, { description?: string; default?: unknown; enum?: string[] }>;
    required?: string[];
  };
};

const EXPECTED_TOOLS: Record<string, { required: string[]; propCount: number }> = {
  kakao_local_search_keyword: { required: ['query'], propCount: 9 },
  kakao_local_search_category: { required: ['category_group_code'], propCount: 8 },
  kakao_local_search_address: { required: ['query'], propCount: 4 },
  kakao_local_geo_coord2address: { required: ['x', 'y'], propCount: 3 },
  kakao_local_geo_coord2regioncode: { required: ['x', 'y'], propCount: 4 },
  kakao_local_geo_transcoord: { required: ['x', 'y', 'output_coord'], propCount: 4 },
};

describe('MCP server wiring', () => {
  let client: TestClient;
  let tools: ToolDef[];
  let close: () => Promise<void>;

  before(async () => {
    // 도구 콜백이 실제로 호출되는 케이스가 있어 키가 없으면 그쪽에서 먼저 죽는다.
    process.env.KAKAO_REST_API_KEY ??= 'test-key-abc';

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const server = buildServer();
    await server.connect(serverTransport);
    await clientTransport.start();
    client = new TestClient(clientTransport);
    close = () => server.close();

    const init = await client.request('initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'test', version: '0.0.0' },
    });
    const result = init.result as Json;
    assert.equal((result.serverInfo as Json).name, SERVER_NAME);
    assert.equal((result.serverInfo as Json).version, SERVER_VERSION);
    assert.ok((result.capabilities as Json).tools, 'tools capability must be advertised');

    await client.notify('notifications/initialized');
    const listed = await client.request('tools/list');
    tools = (listed.result as { tools: ToolDef[] }).tools;
  });

  after(async () => {
    await close();
  });

  it('registers exactly the six Kakao tools', () => {
    assert.deepEqual(
      tools.map((t) => t.name).sort(),
      Object.keys(EXPECTED_TOOLS).sort(),
      'tools/list must expose every registered tool and nothing else',
    );
  });

  it('keeps title, description and readOnly/openWorld annotations on every tool', () => {
    for (const tool of tools) {
      assert.ok(tool.title, `${tool.name} lost its title`);
      assert.ok(tool.description, `${tool.name} lost its description`);
      assert.deepEqual(
        tool.annotations,
        { readOnlyHint: true, openWorldHint: true },
        `${tool.name} lost its annotations`,
      );
    }
  });

  // Zod 스키마 → JSON Schema 변환은 SDK 버전에 따라 갈리는 지점이다.
  // v1은 zod-to-json-schema, v2는 zod 네이티브 toJSONSchema를 쓴다.
  it('converts each Zod schema into an object schema with the right required fields', () => {
    for (const tool of tools) {
      const expected = EXPECTED_TOOLS[tool.name];
      assert.equal(tool.inputSchema.type, 'object', `${tool.name} schema is not an object`);
      assert.deepEqual(
        (tool.inputSchema.required ?? []).sort(),
        [...expected.required].sort(),
        `${tool.name} has the wrong required fields`,
      );
      assert.equal(
        Object.keys(tool.inputSchema.properties).length,
        expected.propCount,
        `${tool.name} has the wrong number of properties`,
      );
    }
  });

  it('carries .describe() text and .default() values through to the JSON Schema', () => {
    const keyword = tools.find((t) => t.name === 'kakao_local_search_keyword');
    assert.ok(keyword);
    assert.equal(keyword.inputSchema.properties.query.description, '검색어');
    assert.equal(keyword.inputSchema.properties.page.default, 1);
    assert.equal(keyword.inputSchema.properties.size.default, 15);
    assert.equal(keyword.inputSchema.properties.sort.default, 'accuracy');
    assert.deepEqual(keyword.inputSchema.properties.sort.enum, ['accuracy', 'distance']);

    // 카테고리 코드 18종은 설명이 길어 자주 잘려나가는 값이라 별도로 본다.
    const category = tools.find((t) => t.name === 'kakao_local_search_category');
    assert.ok(category);
    const codes = category.inputSchema.properties.category_group_code;
    assert.equal(codes.enum?.length, 18);
    assert.match(String(codes.description), /MT1\(대형마트\)/);
  });

  it('applies Zod defaults to the arguments the tool callback receives', async () => {
    // 서버가 생성된 JSON Schema로만 검증하면 .default()가 유실될 수 있다.
    // 콜백까지 실제로 채워져 도착하는지 확인한다.
    const seen: URL[] = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (input: Parameters<typeof fetch>[0]) => {
      seen.push(input instanceof URL ? input : new URL(String(input)));
      return new Response('{"documents":[],"meta":{}}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch;

    try {
      const res = await client.request('tools/call', {
        name: 'kakao_local_search_keyword',
        arguments: { query: '강남역 카페' },
      });
      assert.notEqual((res.result as Json).isError, true, JSON.stringify(res));
    } finally {
      globalThis.fetch = originalFetch;
    }

    assert.equal(seen.length, 1);
    const params = seen[0].searchParams;
    assert.equal(params.get('query'), '강남역 카페');
    assert.equal(params.get('page'), '1', 'page default was not applied');
    assert.equal(params.get('size'), '15', 'size default was not applied');
    assert.equal(params.get('sort'), 'accuracy', 'sort default was not applied');
  });

  it('rejects invalid arguments before reaching the callback', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (() =>
      assert.fail('callback must not run on invalid input')) as typeof fetch;

    try {
      // output_coord는 필수인데 빠졌다.
      const missing = await client.request('tools/call', {
        name: 'kakao_local_geo_transcoord',
        arguments: { x: '127.0', y: '37.0' },
      });
      assert.equal((missing.result as Json).isError, true);

      // sort는 accuracy | distance만 허용한다.
      const badEnum = await client.request('tools/call', {
        name: 'kakao_local_search_keyword',
        arguments: { query: '카페', sort: 'nope' },
      });
      assert.equal((badEnum.result as Json).isError, true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
