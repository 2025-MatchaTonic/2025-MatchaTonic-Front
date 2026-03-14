/**
 * 사용자 관련 API
 * - GET /api/users/me: 로그인 유저 정보 조회
 */

import { buildApiUrl } from "./client"

export interface UserMeResponse {
  id?: number
  name?: string
  email?: string
  avatar?: string
  [key: string]: unknown
}

export async function fetchCurrentUser(): Promise<UserMeResponse> {
  const url = buildApiUrl("/api/users/me")
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`사용자 정보 조회 실패: ${res.status} ${text}`)
  }

  const data = await res.json()
  return data && typeof data === "object" ? data : {}
}
