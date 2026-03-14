/**
 * API 요청 공통 함수
 * - 토큰이 있으면 Authorization 헤더 추가
 * - credentials: "include" (쿠키 + 토큰 모두 지원)
 */

import { buildApiUrl } from "./client"
import { getAuthToken } from "@/lib/auth"

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown
}

export async function apiRequest(
  path: string,
  options: RequestOptions = {}
): Promise<Response> {
  const url = buildApiUrl(path)
  const token = getAuthToken()

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(typeof options.headers === "object" && !Array.isArray(options.headers)
      ? (options.headers as Record<string, string>)
      : {}),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const { body, ...rest } = options
  return fetch(url, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include",
  })
}
