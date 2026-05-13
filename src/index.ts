#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { GeoCoord2AddressSchema, geoCoord2Address } from './tools/geo-coord2address.js';
import { GeoCoord2RegionCodeSchema, geoCoord2RegionCode } from './tools/geo-coord2regioncode.js';
import { GeoTransCoordSchema, geoTransCoord } from './tools/geo-transcoord.js';
import { LocalAddressSchema, localAddress } from './tools/local-address.js';
import { LocalCategorySchema, localCategory } from './tools/local-category.js';
import { LocalKeywordSchema, localKeyword } from './tools/local-keyword.js';

const server = new McpServer({
  name: 'mcp-server-kakao-map',
  version: '0.1.0',
});

server.registerTool(
  'kakao_local_search_keyword',
  {
    title: '카카오 키워드 장소 검색',
    description:
      '키워드로 장소를 검색한다. 좌표(x,y)+radius 또는 rect로 영역 한정 가능. 카테고리 필터, 정확도/거리 정렬, 페이지네이션 지원.',
    inputSchema: LocalKeywordSchema,
  },
  localKeyword,
);

server.registerTool(
  'kakao_local_search_category',
  {
    title: '카카오 카테고리 장소 검색',
    description:
      '카테고리 그룹 코드로 장소를 검색한다. x/y/radius(원형) 또는 rect(사각형) 중 하나로 영역 지정 필수.',
    inputSchema: LocalCategorySchema,
  },
  localCategory,
);

server.registerTool(
  'kakao_local_search_address',
  {
    title: '카카오 주소 검색',
    description: '주소 문자열로 지번/도로명 주소를 검색해 좌표와 행정 정보를 반환한다.',
    inputSchema: LocalAddressSchema,
  },
  localAddress,
);

server.registerTool(
  'kakao_local_geo_coord2address',
  {
    title: '카카오 좌표 → 주소 변환',
    description: '좌표(x,y)를 지번/도로명 주소로 역지오코딩한다.',
    inputSchema: GeoCoord2AddressSchema,
  },
  geoCoord2Address,
);

server.registerTool(
  'kakao_local_geo_coord2regioncode',
  {
    title: '카카오 좌표 → 행정구역',
    description: '좌표(x,y)에 해당하는 행정동(H) 및 법정동(B) 정보를 반환한다.',
    inputSchema: GeoCoord2RegionCodeSchema,
  },
  geoCoord2RegionCode,
);

server.registerTool(
  'kakao_local_geo_transcoord',
  {
    title: '카카오 좌표계 변환',
    description: 'WGS84, TM, KTM, UTM, BESSEL 등 좌표계 간 변환을 수행한다.',
    inputSchema: GeoTransCoordSchema,
  },
  geoTransCoord,
);

await server.connect(new StdioServerTransport());
