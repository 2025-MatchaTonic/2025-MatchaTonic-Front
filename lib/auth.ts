/**
 * OAuth 토큰 저장/조회
 * - 브라우저에서만 동작 (localStorage)
 */

const TOKEN_KEY = "promate_auth_token"
const LEGACY_TOKEN_KEY = "token"

export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token)
    // 백엔드/기존 프론트와의 키 불일치 방지
    localStorage.setItem(LEGACY_TOKEN_KEY, token)
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    // 우선 신규 키, 없으면 레거시 키 fallback
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY)
  }
  return null
}

export function clearAuthToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(LEGACY_TOKEN_KEY)
  }
}
