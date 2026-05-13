export interface LocalMeta {
  total_count: number;
  pageable_count: number;
  is_end: boolean;
}

export interface KeywordMeta extends LocalMeta {
  same_name: {
    region: string[];
    keyword: string;
    selected_region: string;
  } | null;
}

export interface PlaceDocument {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  category_group_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
  // 카카오 docs: x,y 파라미터 제공 시에만 존재
  distance?: string;
}

export interface LocalKeywordResponse {
  meta: KeywordMeta;
  documents: PlaceDocument[];
}

// 카테고리 검색 응답은 키워드 검색과 동일 (meta.same_name 포함, 같은 PlaceDocument 셋)
export type LocalCategoryResponse = LocalKeywordResponse;

export interface AddressOnly {
  address_name: string;
  region_1depth_name: string;
  region_2depth_name: string;
  region_3depth_name: string;
  region_3depth_h_name: string;
  h_code: string;
  b_code: string;
  mountain_yn: 'Y' | 'N';
  main_address_no: string;
  sub_address_no: string;
  x: string;
  y: string;
}

export interface RoadAddress {
  address_name: string;
  region_1depth_name: string;
  region_2depth_name: string;
  region_3depth_name: string;
  road_name: string;
  underground_yn: 'Y' | 'N';
  main_building_no: string;
  sub_building_no: string;
  building_name: string;
  zone_no: string;
  x: string;
  y: string;
}

export interface AddressSearchDocument {
  address_name: string;
  address_type: 'REGION' | 'ROAD' | 'REGION_ADDR' | 'ROAD_ADDR';
  x: string;
  y: string;
  address: AddressOnly | null;
  road_address: RoadAddress | null;
}

export interface LocalAddressResponse {
  meta: LocalMeta;
  documents: AddressSearchDocument[];
}

export interface Coord2AddressDocument {
  road_address: {
    address_name: string;
    region_1depth_name: string;
    region_2depth_name: string;
    region_3depth_name: string;
    road_name: string;
    underground_yn: 'Y' | 'N';
    main_building_no: string;
    sub_building_no: string;
    building_name: string;
    zone_no: string;
  } | null;
  address: {
    address_name: string;
    region_1depth_name: string;
    region_2depth_name: string;
    region_3depth_name: string;
    mountain_yn: 'Y' | 'N';
    main_address_no: string;
    sub_address_no: string;
  } | null;
}

export interface Coord2AddressResponse {
  meta: { total_count: number };
  documents: Coord2AddressDocument[];
}

export interface RegionCodeDocument {
  region_type: 'B' | 'H';
  address_name: string;
  region_1depth_name: string;
  region_2depth_name: string;
  region_3depth_name: string;
  region_4depth_name: string;
  code: string;
  x: number;
  y: number;
}

export interface Coord2RegionCodeResponse {
  meta: { total_count: number };
  documents: RegionCodeDocument[];
}

export interface TransCoordResponse {
  meta: { total_count: number };
  documents: { x: number; y: number }[];
}
