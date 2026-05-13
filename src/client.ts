const BASE_URL = 'https://dapi.kakao.com';

export class KakaoApiError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`Kakao API ${status}: ${body}`);
    this.name = 'KakaoApiError';
  }
}

export type QueryParams = Record<string, string | number | boolean | undefined | null>;

export async function kakaoFetch<T>(path: string, params: QueryParams): Promise<T> {
  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    throw new Error(
      'KAKAO_REST_API_KEY is not set. Provide it via MCP client env config or shell env.',
    );
  }

  const url = new URL(path, BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    url.searchParams.set(key, String(value));
  }

  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${apiKey}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new KakaoApiError(res.status, body);
  }

  return (await res.json()) as T;
}

// MCP 응답 통일. compact JSON — pretty-print는 LLM 입력 토큰만 늘림.
export function okResponse(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}
