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

/** API 응답을 앱 Message 형식으로 변환 */
export function mapChatMessageToAppFormat(
  item: ChatMessageResponse,
  index: number
): Message {
  const timestamp = new Date(item.createdAt)
  let text = item.message

  if (item.type === "ENTER") {
    text = `${item.senderName}님이 입장했습니다.`
  } else if (item.type === "LEAVE") {
    text = `${item.senderName}님이 퇴장했습니다.`
  }

  return {
    id: `api-${item.projectId}-${item.createdAt}-${index}`,
    sender: "user",
    text,
    timestamp,
    senderEmail: item.senderEmail,
    senderName: item.senderName,
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
  return Array.isArray(data) ? data : []
}

/** REST API로 채팅 메시지 전송 (WebSocket 미동작 시 폴백) */
export async function sendChatMessageViaApi(
  projectId: number,
  message: string
): Promise<void> {
  const res = await apiRequest(`/api/chat/${projectId}/messages`, {
    method: "POST",
    body: { message },
  })
  if (!res.ok) {
    throw new Error(`채팅 전송 실패: ${res.status}`)
  }
}
