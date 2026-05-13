import { z } from 'zod';

export const CATEGORY_GROUP_CODES = [
  'MT1',
  'CS2',
  'PS3',
  'SC4',
  'AC5',
  'PK6',
  'OL7',
  'SW8',
  'BK9',
  'CT1',
  'AG2',
  'PO3',
  'AT4',
  'AD5',
  'FD6',
  'CE7',
  'HP8',
  'PM9',
] as const;

export const CATEGORY_GROUP_DESCRIPTION =
  'MT1(대형마트) CS2(편의점) PS3(어린이집,유치원) SC4(학교) AC5(학원) PK6(주차장) OL7(주유소,충전소) SW8(지하철역) BK9(은행) CT1(문화시설) AG2(중개업소) PO3(공공기관) AT4(관광명소) AD5(숙박) FD6(음식점) CE7(카페) HP8(병원) PM9(약국)';

export const COORD_SYSTEMS = [
  'WGS84',
  'WCONGNAMUL',
  'CONGNAMUL',
  'WTM',
  'TM',
  'KTM',
  'UTM',
  'BESSEL',
  'WKTM',
  'WUTM',
] as const;

// coord2address, coord2regioncode가 허용하는 5종 좌표계
// (transcoord만 KTM/UTM/BESSEL/WKTM/WUTM 5종을 추가로 받음)
export const COMMON_COORD_SYSTEMS = ['WGS84', 'WCONGNAMUL', 'CONGNAMUL', 'WTM', 'TM'] as const;

export const xParam = z.string().describe('경도 (longitude)');
export const yParam = z.string().describe('위도 (latitude)');

// 공통 페이지/정렬 (Local 장소 검색 3종)
export const pageParam = z.number().int().min(1).max(45).default(1).describe('페이지 번호, 1-45');
export const placeSizeParam = z
  .number()
  .int()
  .min(1)
  .max(15)
  .default(15)
  .describe('한 페이지 결과 수, 1-15');
export const placeSortParam = z
  .enum(['accuracy', 'distance'])
  .default('accuracy')
  .describe('accuracy(정확도) | distance(거리)');

// 좌표 → 주소/행정구역 변환에서 쓰는 input_coord 기본형
export const commonInputCoord = z
  .enum(COMMON_COORD_SYSTEMS)
  .default('WGS84')
  .describe('입력 좌표계');
