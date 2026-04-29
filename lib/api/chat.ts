/**
 * 과거 채팅 내역 조회 API
 * GET /api/chat/{projectId}/messages
 */

import { apiRequest } from "./request"
import type { Message } from "@/lib/store"

export interface ChatMessageResponse {
  type: string
  projectId: number
  senderEmail: string
  senderName: string
  message: string
  createdAt: string
}

const AI_SENDER_EMAILS = ["ai@promate.ai", "system@promate.ai", "mates@promate.ai"]
const AI_MESSAGE_TYPES = ["SYSTEM", "AI"]

function isAiMessage(item: ChatMessageResponse): boolean {
  if (AI_MESSAGE_TYPES.includes(item.type?.toUpperCase?.())) return true
  if (item.senderEmail && AI_SENDER_EMAILS.includes(item.senderEmail.toLowerCase())) return true
  if (item.senderName?.toLowerCase() === "mates" || item.senderName?.toLowerCase() === "ai") return true
  return false
}

function safeTimestamp(value: unknown): Date {
  if (value == null) return new Date()
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value)
    if (!Number.isNaN(d.getTime())) return d
  }
  return new Date()
}

/** API 응답을 앱 Message 형식으로 변환 */
export function mapChatMessageToAppFormat(
  item: ChatMessageResponse,
  index: number
): Message {
  const timestamp = safeTimestamp(item?.createdAt)
  let text = item?.message ?? ""

  if (item?.type === "ENTER") {
    text = `${item.senderName ?? "사용자"}님이 입장했습니다.`
  } else if (item?.type === "LEAVE") {
    text = `${item.senderName ?? "사용자"}님이 퇴장했습니다.`
  }

  const sender = item && isAiMessage(item) ? "ai" : "user"

  return {
    id: `api-${item?.projectId ?? "unknown"}-${item?.createdAt ?? index}-${index}`,
    sender,
    text,
    timestamp,
    senderEmail: item?.senderEmail,
    senderName: item?.senderName,
  }
}

export async function fetchChatMessages(
  projectId: number
): Promise<ChatMessageResponse[]> {
  const res = await apiRequest(`/api/chat/${projectId}/messages`, { method: "GET" })

  if (!res.ok) {
    throw new Error(`채팅 내역 조회 실패: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  if (Array.isArray(data)) return data
  if (data && Array.isArray((data as { content?: unknown[] }).content)) return (data as { content: unknown[] }).content as ChatMessageResponse[]
  if (data && Array.isArray((data as { data?: unknown[] }).data)) return (data as { data: unknown[] }).data as ChatMessageResponse[]
  if (data && Array.isArray((data as { messages?: unknown[] }).messages)) return (data as { messages: unknown[] }).messages as ChatMessageResponse[]
  return []
}

/** REST API로 채팅 메시지 전송 (WebSocket 미동작 시 폴백) */
export async function sendChatMessageViaApi(
  projectId: number,
  message: string,
  senderEmail?: string,
  senderName?: string
): Promise<void> {
  const res = await apiRequest(`/api/chat/${projectId}/messages`, {
    method: "POST",
    body: { type: "TALK", projectId, message, senderEmail, senderName },
  })
  if (!res.ok) {
    console.warn(`[REST 폴백] 채팅 전송 실패: ${res.status}`)
    throw new Error(`채팅 전송 실패: ${res.status}`)
  }
}
