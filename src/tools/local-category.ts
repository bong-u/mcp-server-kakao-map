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
import type { LocalCategoryResponse } from '../types/local.js';

export const LocalCategorySchema = {
  category_group_code: z.enum(CATEGORY_GROUP_CODES).describe(CATEGORY_GROUP_DESCRIPTION),
  x: xParam.optional(),
  y: yParam.optional(),
  radius: z
    .number()
    .int()
    .min(0)
    .max(20000)
    .optional()
    .describe('중심 좌표로부터의 반경(m), 0-20000. x,y와 함께 지정'),
  rect: z
    .string()
    .optional()
    .describe('사각 영역: "좌하단X,좌하단Y,우상단X,우상단Y". x/y/radius 또는 rect 중 하나는 필수'),
  page: pageParam,
  size: placeSizeParam,
  sort: placeSortParam,
};

export const localCategory: ToolCallback<typeof LocalCategorySchema> = async (input) => {
  const hasCircle = input.x !== undefined && input.y !== undefined && input.radius !== undefined;
  const hasRect = input.rect !== undefined;
  if (!hasCircle && !hasRect) {
    throw new Error(
      'category search requires either (x, y, radius) or rect to define the search area',
    );
  }
  const data = await kakaoFetch<LocalCategoryResponse>('/v2/local/search/category.json', input);
  return okResponse(data);
};
