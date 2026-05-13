import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { kakaoFetch, okResponse } from '../client.js';
import { COORD_SYSTEMS, xParam, yParam } from '../schemas/common.js';
import type { TransCoordResponse } from '../types/local.js';

export const GeoTransCoordSchema = {
  x: xParam,
  y: yParam,
  input_coord: z.enum(COORD_SYSTEMS).default('WGS84').describe('입력 좌표계'),
  output_coord: z.enum(COORD_SYSTEMS).describe('출력 좌표계 (필수)'),
};

export const geoTransCoord: ToolCallback<typeof GeoTransCoordSchema> = async (input) => {
  const data = await kakaoFetch<TransCoordResponse>('/v2/local/geo/transcoord.json', input);
  return okResponse(data);
};
