import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { kakaoFetch, okResponse } from '../client.js';
import { commonInputCoord, xParam, yParam } from '../schemas/common.js';
import type { Coord2AddressResponse } from '../types/local.js';

export const GeoCoord2AddressSchema = {
  x: xParam,
  y: yParam,
  input_coord: commonInputCoord,
};

export const geoCoord2Address: ToolCallback<typeof GeoCoord2AddressSchema> = async (input) => {
  const data = await kakaoFetch<Coord2AddressResponse>('/v2/local/geo/coord2address.json', input);
  return okResponse(data);
};
