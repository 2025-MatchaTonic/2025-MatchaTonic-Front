/**
 * OAuth 토큰 저장/조회
 * - 브라우저에서만 동작 (localStorage)
 */

import { getApiBaseUrl } from "@/lib/api/client"
import { useAppStore } from "@/lib/store"

const TOKEN_KEY = "promate_auth_token"
const LEGACY_TOKEN_KEY = "token"
export const APP_STORAGE_KEY = "promate-storage"

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

/** Zustand persist + 토큰 제거 (로그아웃 시 재로그인 방지) */
export function clearAppSession(): void {
  clearAuthToken()
  if (typeof window === "undefined") return
  localStorage.removeItem(APP_STORAGE_KEY)
  const store = useAppStore.getState()
  store.setUser(null)
  store.setScreen("login")
  store.setCurrentProjectId(null)
}

/**
 * 로그아웃: 로컬 세션 정리 후 백엔드 세션 무효화
 * 백엔드 Spring Security: GET /api/users/logout
 */
export function performLogout(): void {
  if (typeof window === "undefined") return

  const base = getApiBaseUrl()
  const origin = window.location.origin
  const useBackendLogout = process.env.NEXT_PUBLIC_USE_BACKEND_LOGOUT !== "false"

  clearAppSession()

  if (base && useBackendLogout) {
    const redirectUri = encodeURIComponent(`${origin}/?logged_out=1`)
    window.location.href = `${base.replace(/\/$/, "")}/api/users/logout?post_logout_redirect_uri=${redirectUri}`
    return
  }

  window.location.href = `${origin}/#login`
}

/** OAuth 리다이렉트 복귀 시 ?logged_out=1 처리 */
export function applyLoggedOutQueryParam(): boolean {
  if (typeof window === "undefined") return false
  const params = new URLSearchParams(window.location.search)
  if (params.get("logged_out") !== "1") return false
  clearAppSession()
  window.history.replaceState({}, "", `${window.location.pathname}#login`)
  return true
}
