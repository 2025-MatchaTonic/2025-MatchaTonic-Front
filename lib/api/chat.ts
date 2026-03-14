/**
 * 과거 채팅 내역 조회 API
 * GET /api/chat/{projectId}/messages
 */

import { buildApiUrl } from "./client"
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
  }
}

export async function fetchChatMessages(
  projectId: number
): Promise<ChatMessageResponse[]> {
  const url = buildApiUrl(`/api/chat/${projectId}/messages`)

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!res.ok) {
    throw new Error(`채팅 내역 조회 실패: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  return Array.isArray(data) ? data : []
}
