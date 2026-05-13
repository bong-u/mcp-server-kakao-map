# mcp-server-kakao-map

카카오 Local REST API(장소·주소 검색, 지오코딩, 좌표계 변환)를 6개 MCP 도구로 노출하는 서버. `npx`로 설치 없이 실행.

Successor of [cgoinglove/mcp-server-kakao-map](https://github.com/cgoinglove/mcp-server-kakao-map).

## Quick Start

1. [Kakao Developers](https://developers.kakao.com/)에서 REST API 키 발급 (앱 추가 → 요약 정보의 REST API 키 → 카카오맵 활성화 ON).
2. 사용하는 MCP 클라이언트 설정에 아래 블록 추가. Node.js 20+ 필요.

### Claude Code

`.mcp.json` 또는 `~/.claude.json`:

```json
{
  "mcpServers": {
    "kakaomap": {
      "command": "npx",
      "args": ["-y", "mcp-server-kakao-map@0.1.0"],
      "env": { "KAKAO_REST_API_KEY": "<YOUR_KEY>" }
    }
  }
}
```

또는 CLI:

```sh
claude mcp add kakaomap --env KAKAO_REST_API_KEY=<YOUR_KEY> -- npx -y mcp-server-kakao-map@0.1.0
```

### Codex

`~/.codex/config.toml`:

```toml
[mcp_servers.kakaomap]
command = "npx"
args = ["-y", "mcp-server-kakao-map@0.1.0"]

[mcp_servers.kakaomap.env]
KAKAO_REST_API_KEY = "<YOUR_KEY>"
```

### Hermes agent

`~/.hermes/config.yaml`:

```yaml
mcp_servers:
  kakaomap:
    command: "npx"
    args: ["-y", "mcp-server-kakao-map@0.1.0"]
    env:
      KAKAO_REST_API_KEY: "<YOUR_KEY>"
```

## Tools

원문 명세: [Kakao Local API 개발 가이드](https://developers.kakao.com/docs/ko/local/dev-guide).

| 도구 | 엔드포인트 |
|---|---|
| `kakao_local_search_keyword` | `/v2/local/search/keyword.json` |
| `kakao_local_search_category` | `/v2/local/search/category.json` |
| `kakao_local_search_address` | `/v2/local/search/address.json` |
| `kakao_local_geo_coord2address` | `/v2/local/geo/coord2address.json` |
| `kakao_local_geo_coord2regioncode` | `/v2/local/geo/coord2regioncode.json` |
| `kakao_local_geo_transcoord` | `/v2/local/geo/transcoord.json` |

<details>
<summary><b>kakao_local_search_keyword</b> — 키워드 장소 검색</summary>

| 파라미터 | 타입 | 비고 |
|---|---|---|
| `query` | string ✅ | 검색어 |
| `category_group_code` | enum | MT1, CS2, PS3, SC4, AC5, PK6, OL7, SW8, BK9, CT1, AG2, PO3, AT4, AD5, FD6, CE7, HP8, PM9 |
| `x`, `y` | string | 중심 좌표 (경도, 위도) |
| `radius` | int 0–20000 | 중심 반경(m) |
| `rect` | string | `좌하단X,좌하단Y,우상단X,우상단Y` |
| `page` | int 1–45, 기본 1 | |
| `size` | int 1–15, 기본 15 | |
| `sort` | `accuracy` \| `distance` | 기본 accuracy |

</details>

<details>
<summary><b>kakao_local_search_category</b> — 카테고리 장소 검색</summary>

`category_group_code` 필수. `x/y/radius` 또는 `rect` 중 하나로 영역 지정 필수.

</details>

<details>
<summary><b>kakao_local_search_address</b> — 주소 검색</summary>

| 파라미터 | 타입 | 비고 |
|---|---|---|
| `query` | string ✅ | 주소 문자열 |
| `analyze_type` | `similar` \| `exact` | 기본 similar |
| `page` | int 1–45, 기본 1 | |
| `size` | int 1–30, 기본 10 | |

</details>

<details>
<summary><b>kakao_local_geo_coord2address</b> — 좌표 → 주소</summary>

`x`, `y` 필수. `input_coord`: `WGS84` (기본) / `WCONGNAMUL` / `CONGNAMUL` / `WTM` / `TM`.

</details>

<details>
<summary><b>kakao_local_geo_coord2regioncode</b> — 좌표 → 행정구역</summary>

`x`, `y` 필수. 행정동(`H`) + 법정동(`B`) 두 건 반환. `input_coord`/`output_coord` 모두 5종 좌표계 (기본 `WGS84`).

</details>

<details>
<summary><b>kakao_local_geo_transcoord</b> — 좌표계 변환</summary>

좌표계 (입출력 모두): `WGS84` / `WCONGNAMUL` / `CONGNAMUL` / `WTM` / `TM` / `KTM` / `UTM` / `BESSEL` / `WKTM` / `WUTM`. `output_coord` 필수, `input_coord` 기본 `WGS84`.

</details>

## Development

```sh
git clone https://github.com/bong-u/mcp-server-kakao-map.git
cd mcp-server-kakao-map
npm install
cp .env.example .env  # KAKAO_REST_API_KEY 채우기
npm run dev
```

| 명령 | 설명 |
|---|---|
| `npm run lint` | Biome |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | `node:test` 유닛 (키 불필요) |
| `npm run smoke` | 실 API로 6개 도구 호출 + `report.html` (`.env` 필요) |
| `npm run build` | `dist/` 빌드 |

로컬 빌드본을 바로 물리려면:

```json
{
  "mcpServers": {
    "kakaomap": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"],
      "env": { "KAKAO_REST_API_KEY": "<YOUR_KEY>" }
    }
  }
}
```

## License

MIT
