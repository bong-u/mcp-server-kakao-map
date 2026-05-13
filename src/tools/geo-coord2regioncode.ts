import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { kakaoFetch, okResponse } from '../client.js';
import { COMMON_COORD_SYSTEMS, commonInputCoord, xParam, yParam } from '../schemas/common.js';
import type { Coord2RegionCodeResponse } from '../types/local.js';

export const GeoCoord2RegionCodeSchema = {
  x: xParam,
  y: yParam,
  input_coord: commonInputCoord,
  output_coord: z.enum(COMMON_COORD_SYSTEMS).default('WGS84').describe('출력 좌표계'),
};

export const geoCoord2RegionCode: ToolCallback<typeof GeoCoord2RegionCodeSchema> = async (
  input,
) => {
  const data = await kakaoFetch<Coord2RegionCodeResponse>(
    '/v2/local/geo/coord2regioncode.json',
    input,
  );
  return okResponse(data);
};
