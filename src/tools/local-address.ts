import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { kakaoFetch, okResponse } from '../client.js';
import type { LocalAddressResponse } from '../types/local.js';

// address 검색은 size 상한이 30이라 placeSizeParam(15) 못 씀.
export const LocalAddressSchema = {
  query: z.string().min(1).describe('주소 문자열'),
  analyze_type: z
    .enum(['similar', 'exact'])
    .default('similar')
    .describe('similar: 유사 매칭, exact: 정확 매칭'),
  page: z.number().int().min(1).max(45).default(1),
  size: z.number().int().min(1).max(30).default(10),
};

export const localAddress: ToolCallback<typeof LocalAddressSchema> = async (input) => {
  const data = await kakaoFetch<LocalAddressResponse>('/v2/local/search/address.json', input);
  return okResponse(data);
};
