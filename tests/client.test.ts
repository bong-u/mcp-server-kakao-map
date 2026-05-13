import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { KakaoApiError, kakaoFetch } from '../src/client.js';

type FetchMock = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const originalFetch = globalThis.fetch;
const originalKey = process.env.KAKAO_REST_API_KEY;

function installFetch(mock: FetchMock): { calls: Array<{ url: URL; init?: RequestInit }> } {
  const calls: Array<{ url: URL; init?: RequestInit }> = [];
  globalThis.fetch = (async (input, init) => {
    const url = input instanceof URL ? input : new URL(String(input));
    calls.push({ url, init });
    return mock(input, init);
  }) as typeof fetch;
  return { calls };
}

describe('kakaoFetch', () => {
  beforeEach(() => {
    process.env.KAKAO_REST_API_KEY = 'test-key-abc';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.KAKAO_REST_API_KEY;
    else process.env.KAKAO_REST_API_KEY = originalKey;
  });

  it('throws when API key is missing', async () => {
    delete process.env.KAKAO_REST_API_KEY;
    await assert.rejects(
      () => kakaoFetch('/v2/local/search/keyword.json', { query: 'x' }),
      /KAKAO_REST_API_KEY is not set/,
    );
  });

  it('builds URL with base + path + params and attaches Authorization header', async () => {
    const { calls } = installFetch(
      async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    await kakaoFetch('/v2/local/search/keyword.json', {
      query: '강남역',
      page: 2,
      size: 10,
      missing: undefined,
      nullish: null,
    });

    const [call] = calls;
    if (!call) throw new Error('expected exactly one fetch call');
    assert.equal(call.url.origin, 'https://dapi.kakao.com');
    assert.equal(call.url.pathname, '/v2/local/search/keyword.json');
    assert.equal(call.url.searchParams.get('query'), '강남역');
    assert.equal(call.url.searchParams.get('page'), '2');
    assert.equal(call.url.searchParams.get('size'), '10');
    assert.equal(call.url.searchParams.has('missing'), false, 'undefined params must be skipped');
    assert.equal(call.url.searchParams.has('nullish'), false, 'null params must be skipped');

    const headers = new Headers(call.init?.headers);
    assert.equal(headers.get('authorization'), 'KakaoAK test-key-abc');
  });

  it('returns parsed JSON on 2xx', async () => {
    installFetch(
      async () => new Response(JSON.stringify({ documents: [{ id: '1' }] }), { status: 200 }),
    );

    const data = await kakaoFetch<{ documents: Array<{ id: string }> }>(
      '/v2/local/search/keyword.json',
      {
        query: 'x',
      },
    );

    assert.deepEqual(data, { documents: [{ id: '1' }] });
  });

  it('throws KakaoApiError on 4xx with status and body', async () => {
    installFetch(async () => new Response('Invalid query', { status: 400 }));

    await assert.rejects(
      () => kakaoFetch('/v2/local/search/keyword.json', {}),
      (err: unknown) => {
        assert.ok(err instanceof KakaoApiError, 'expected KakaoApiError');
        assert.equal(err.status, 400);
        assert.equal(err.body, 'Invalid query');
        assert.match(err.message, /Kakao API 400/);
        return true;
      },
    );
  });

  it('throws KakaoApiError on 401 (auth)', async () => {
    installFetch(async () => new Response('Unauthorized', { status: 401 }));

    await assert.rejects(
      () => kakaoFetch('/v2/local/search/keyword.json', { query: 'x' }),
      (err: unknown) => err instanceof KakaoApiError && err.status === 401,
    );
  });

  it('throws KakaoApiError on 429 (quota)', async () => {
    installFetch(async () => new Response('Too Many Requests', { status: 429 }));

    await assert.rejects(
      () => kakaoFetch('/v2/local/search/keyword.json', { query: 'x' }),
      (err: unknown) => err instanceof KakaoApiError && err.status === 429,
    );
  });
});
