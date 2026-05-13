import { writeFileSync } from 'node:fs';
import { z } from 'zod';
import { GeoCoord2AddressSchema, geoCoord2Address } from '../src/tools/geo-coord2address.js';
import {
  GeoCoord2RegionCodeSchema,
  geoCoord2RegionCode,
} from '../src/tools/geo-coord2regioncode.js';
import { GeoTransCoordSchema, geoTransCoord } from '../src/tools/geo-transcoord.js';
import { LocalAddressSchema, localAddress } from '../src/tools/local-address.js';
import { LocalCategorySchema, localCategory } from '../src/tools/local-category.js';
import { LocalKeywordSchema, localKeyword } from '../src/tools/local-keyword.js';

type ToolResult = { content: { type: string; text: string }[] };
type Scenario = {
  tool: string;
  description: string;
  input: Record<string, unknown>;
  schema: z.ZodRawShape;
  callback: (parsed: unknown, extra: unknown) => Promise<ToolResult>;
};

const scenarios: Scenario[] = [
  {
    tool: 'kakao_local_search_keyword',
    description: '강남역 500m 내 카페, 거리순',
    input: { query: '강남역 카페', sort: 'distance', x: '127.0276', y: '37.4979', radius: 500 },
    schema: LocalKeywordSchema,
    callback: localKeyword as Scenario['callback'],
  },
  {
    tool: 'kakao_local_search_category',
    description: '강남역 300m 내 카페 (카테고리 CE7)',
    input: { category_group_code: 'CE7', x: '127.0276', y: '37.4979', radius: 300 },
    schema: LocalCategorySchema,
    callback: localCategory as Scenario['callback'],
  },
  {
    tool: 'kakao_local_search_address',
    description: '서울 강남구 역삼동 주소 검색',
    input: { query: '서울 강남구 역삼동 736-36' },
    schema: LocalAddressSchema,
    callback: localAddress as Scenario['callback'],
  },
  {
    tool: 'kakao_local_geo_coord2address',
    description: '강남역 좌표 → 주소',
    input: { x: '127.0276', y: '37.4979' },
    schema: GeoCoord2AddressSchema,
    callback: geoCoord2Address as Scenario['callback'],
  },
  {
    tool: 'kakao_local_geo_coord2regioncode',
    description: '강남역 좌표 → 행정/법정동',
    input: { x: '127.0276', y: '37.4979' },
    schema: GeoCoord2RegionCodeSchema,
    callback: geoCoord2RegionCode as Scenario['callback'],
  },
  {
    tool: 'kakao_local_geo_transcoord',
    description: 'WGS84 → WCONGNAMUL 좌표 변환',
    input: { x: '127.0276', y: '37.4979', output_coord: 'WCONGNAMUL' },
    schema: GeoTransCoordSchema,
    callback: geoTransCoord as Scenario['callback'],
  },
];

type RunResult = {
  scenario: Scenario;
  ok: boolean;
  payload?: unknown;
  parsedInput?: unknown;
  error?: string;
  ms: number;
};

async function runScenario(sc: Scenario): Promise<RunResult> {
  const start = Date.now();
  try {
    const parsed = z.object(sc.schema).parse(sc.input);
    const out = await sc.callback(parsed, {});
    const payload = JSON.parse(out.content?.[0]?.text ?? '');
    const ms = Date.now() - start;
    console.log(`✔ ${sc.tool}  (${ms}ms)`);
    return { scenario: sc, ok: true, payload, parsedInput: parsed, ms };
  } catch (e) {
    const ms = Date.now() - start;
    const error = e instanceof Error ? e.message : String(e);
    console.log(`✘ ${sc.tool}: ${error}`);
    return { scenario: sc, ok: false, error, ms };
  }
}

const wallStart = Date.now();
const results = await Promise.all(scenarios.map(runScenario));
const wallMs = Date.now() - wallStart;

const okCount = results.filter((r) => r.ok).length;

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function preview(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return '';
  const p: any = payload;
  const lines: string[] = [];
  if (p.meta) {
    const m = p.meta;
    const bits = [];
    if ('total_count' in m) bits.push(`total=${m.total_count}`);
    if ('pageable_count' in m) bits.push(`pageable=${m.pageable_count}`);
    if ('is_end' in m) bits.push(`is_end=${m.is_end}`);
    if (bits.length) lines.push(`<div class="meta">meta: ${bits.join(' · ')}</div>`);
  }
  if (Array.isArray(p.documents)) {
    lines.push(`<div class="count">documents: <b>${p.documents.length}</b>건</div>`);
    const sample = p.documents.slice(0, 3).map((d: any, i: number) => {
      const label =
        d.place_name ||
        d.address_name ||
        d.title ||
        d.image_url ||
        d.region_3depth_name ||
        `(doc #${i})`;
      const sub = d.road_address_name || d.url || d.address?.address_name || d.collection || '';
      return `<li><b>${escapeHtml(String(label))}</b>${sub ? ` <span class="sub">— ${escapeHtml(String(sub))}</span>` : ''}</li>`;
    });
    if (sample.length) lines.push(`<ul class="sample">${sample.join('')}</ul>`);
  }
  return lines.join('');
}

const rows = results
  .map((r, i) => {
    const status = r.ok ? '<span class="ok">PASS</span>' : '<span class="fail">FAIL</span>';
    const body = r.ok
      ? `${preview(r.payload)}
         <details><summary>raw input</summary><pre>${escapeHtml(JSON.stringify(r.parsedInput, null, 2))}</pre></details>
         <details><summary>raw response</summary><pre>${escapeHtml(JSON.stringify(r.payload, null, 2))}</pre></details>`
      : `<div class="err">${escapeHtml(r.error ?? '')}</div>
         <details><summary>raw input</summary><pre>${escapeHtml(JSON.stringify(r.scenario.input, null, 2))}</pre></details>`;
    return `
      <section class="case ${r.ok ? 'pass' : 'fail'}">
        <header>
          <h2><span class="idx">${i + 1}</span> <code>${escapeHtml(r.scenario.tool)}</code> ${status} <span class="ms">${r.ms}ms</span></h2>
          <p class="desc">${escapeHtml(r.scenario.description)}</p>
        </header>
        ${body}
      </section>`;
  })
  .join('\n');

const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<title>Kakao MCP smoke test report</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; max-width: 960px; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; color: #222; }
  h1 { margin-bottom: 0.2rem; }
  .summary { padding: 0.8rem 1rem; border-radius: 6px; background: #f3f4f6; margin-bottom: 1.5rem; }
  .summary b { font-size: 1.1rem; }
  .case { border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem 1.2rem; margin-bottom: 1rem; }
  .case.pass { border-left: 4px solid #16a34a; }
  .case.fail { border-left: 4px solid #dc2626; background: #fef2f2; }
  .case h2 { margin: 0; font-size: 1rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }
  .idx { background: #e5e7eb; border-radius: 100px; width: 1.6rem; height: 1.6rem; display: inline-flex; align-items: center; justify-content: center; font-size: 0.8rem; }
  .desc { color: #6b7280; margin: 0.3rem 0 0.7rem; font-size: 0.9rem; }
  .ok { color: #16a34a; font-weight: 600; }
  .fail { color: #dc2626; font-weight: 600; }
  .ms { margin-left: auto; color: #9ca3af; font-size: 0.8rem; font-weight: 400; }
  code { background: #f3f4f6; padding: 0.1rem 0.35rem; border-radius: 4px; font-size: 0.9em; }
  pre { background: #1f2937; color: #f9fafb; padding: 0.8rem; border-radius: 6px; overflow-x: auto; font-size: 0.78rem; max-height: 320px; }
  details { margin-top: 0.5rem; }
  details summary { cursor: pointer; color: #6b7280; font-size: 0.85rem; }
  .meta { font-size: 0.85rem; color: #6b7280; }
  .count { margin: 0.4rem 0; font-size: 0.95rem; }
  .sample { margin: 0.3rem 0 0; padding-left: 1.2rem; }
  .sample li { font-size: 0.9rem; margin: 0.2rem 0; }
  .sub { color: #6b7280; font-size: 0.85em; }
  .err { background: #fee2e2; color: #991b1b; padding: 0.7rem; border-radius: 6px; font-family: monospace; font-size: 0.85rem; white-space: pre-wrap; }
  footer { color: #9ca3af; font-size: 0.8rem; margin-top: 2rem; text-align: center; }
</style>
</head>
<body>
  <h1>Kakao MCP smoke test report</h1>
  <p class="desc">${results.length}개 도구를 실제 카카오 REST API로 호출한 결과.</p>
  <div class="summary">
    <b>${okCount} / ${results.length} passed</b> · wall ${wallMs}ms · ran at ${new Date().toLocaleString('ko-KR')}
  </div>
  ${rows}
  <footer>generated by tests/smoke.ts</footer>
</body>
</html>`;

writeFileSync('report.html', html, 'utf-8');
console.log(`\n📝 report.html written. ${okCount}/${results.length} passed.`);
