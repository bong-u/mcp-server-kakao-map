const BASE_URL = 'https://dapi.kakao.com';

// 실측 응답이 50-130ms대라 정상 요청이 걸릴 일은 없는 값.
// MCP 클라이언트 기본 요청 타임아웃(60s)보다 짧아야 우리 에러가 모델에 전달된다.
const TIMEOUT_MS = 10_000;

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

  // 타임아웃은 헤더 수신 후에도 살아있어 바디를 읽는 중에 터질 수 있다.
  // 그래서 본문 읽기까지 같은 try 안에 둔다.
  try {
    const res = await fetch(url, {
      headers: { Authorization: `KakaoAK ${apiKey}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new KakaoApiError(res.status, body);
    }

    return (await res.json()) as T;
  } catch (e) {
    // 원본 메시지("The operation was aborted due to timeout")로는
    // 카카오가 응답을 안 준 건지 코드가 깨진 건지 구분이 안 된다.
    if (e instanceof Error && e.name === 'TimeoutError') {
      throw new Error(`Kakao API did not respond within ${TIMEOUT_MS}ms: ${path}`, { cause: e });
    }
    throw e;
  }
}

// MCP 응답 통일. compact JSON — pretty-print는 LLM 입력 토큰만 늘림.
export function okResponse(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}
