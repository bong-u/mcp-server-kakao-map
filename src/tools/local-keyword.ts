import type { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { kakaoFetch, okResponse } from '../client.js';
import {
  CATEGORY_GROUP_CODES,
  CATEGORY_GROUP_DESCRIPTION,
  pageParam,
  placeSizeParam,
  placeSortParam,
  xParam,
  yParam,
} from '../schemas/common.js';
import type { LocalKeywordResponse } from '../types/local.js';

export const LocalKeywordSchema = {
  query: z.string().min(1).describe('검색어'),
  category_group_code: z.enum(CATEGORY_GROUP_CODES).optional().describe(CATEGORY_GROUP_DESCRIPTION),
  x: xParam.optional(),
  y: yParam.optional(),
  radius: z
    .number()
    .int()
    .min(0)
    .max(20000)
    .optional()
    .describe('중심 좌표로부터의 반경(m), 0-20000. x,y와 함께 지정해야 함'),
  rect: z.string().optional().describe('사각 영역: "좌하단X,좌하단Y,우상단X,우상단Y"'),
  page: pageParam,
  size: placeSizeParam,
  sort: placeSortParam,
};

export const localKeyword: ToolCallback<typeof LocalKeywordSchema> = async (input) => {
  if (input.radius !== undefined && (input.x === undefined || input.y === undefined)) {
    throw new Error('radius requires x and y');
  }
  const data = await kakaoFetch<LocalKeywordResponse>('/v2/local/search/keyword.json', input);
  return okResponse(data);
};
