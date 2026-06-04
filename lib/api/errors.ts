export type ApiErrorBody = {
  status?: number
  code?: string
  message?: string
}

export class ApiRequestError extends Error {
  readonly status: number
  readonly apiCode?: string

  constructor(status: number, message: string, apiCode?: string) {
    super(message)
    this.name = "ApiRequestError"
    this.status = status
    this.apiCode = apiCode
  }
}

export async function parseApiErrorResponse(
  res: Response,
  fallback: string
): Promise<ApiRequestError> {
  const text = await res.text().catch(() => "")
  let message = fallback
  let apiCode: string | undefined

  if (text) {
    try {
      const json = JSON.parse(text) as ApiErrorBody
      if (json.message) message = String(json.message)
      if (json.code) apiCode = String(json.code)
    } catch {
      message = text
    }
  }

  return new ApiRequestError(res.status, message, apiCode)
}

/** 삭제 권한 없음(401)과 로그인 만료 구분 */
export function isAuthSessionError(err: unknown): boolean {
  if (!(err instanceof ApiRequestError)) return false
  if (err.status !== 401 && err.status !== 403) return false
  const m = err.message
  if (m.includes("삭제 권한") || m.includes("권한이 없습니다")) return false
  return (
    err.apiCode === "UNAUTHORIZED" ||
    m.includes("로그인") ||
    m.includes("인증")
  )
}
