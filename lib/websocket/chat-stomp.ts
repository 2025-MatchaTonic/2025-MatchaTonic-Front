/**
 * STOMP 채팅 WebSocket (백엔드 전달 기준)
 *
 * 구독: /sub/project/{projectId}
 * 발신: /pub/chat/message
 */

import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import { getApiBaseUrl } from "@/lib/api/client"
import { getAuthToken } from "@/lib/auth"
import { mapChatMessageToAppFormat } from "@/lib/api/chat"
import type { Message } from "@/lib/store"

export const STOMP_PATHS = {
  subscribe: (projectId: number) => `/sub/project/${projectId}`,
  publish: "/pub/chat/message",
} as const

export interface StompChatPayload {
  type?: string
  projectId?: number
  senderEmail?: string
  senderName?: string
  message?: string
  createdAt?: string
  [key: string]: unknown
}

export function getWsStompUrl(): string {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_WS_STOMP_URL) {
    return process.env.NEXT_PUBLIC_WS_STOMP_URL
  }
  const base = getApiBaseUrl() || "https://api.promate.ai.kr"
  const url = base.replace(/\/$/, "")
  return `${url}/ws-stomp`
}

export function createChatStompClient(
  projectId: number,
  onMessage: (msg: Message) => void
): Client {
  const wsUrl = getWsStompUrl()
  const token = getAuthToken()

  const client = new Client({
    webSocketFactory: () => new SockJS(wsUrl) as unknown as WebSocket,
    connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    reconnectDelay: 3000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    onConnect: () => {
      client.subscribe(STOMP_PATHS.subscribe(projectId), (frame) => {
        try {
          const payload: StompChatPayload = JSON.parse(frame.body)
          const mapped = mapChatMessageToAppFormat(
            {
              type: payload.type ?? "CHAT",
              projectId: payload.projectId ?? projectId,
              senderEmail: payload.senderEmail ?? "",
              senderName: payload.senderName ?? "",
              message: payload.message ?? "",
              createdAt: payload.createdAt ?? new Date().toISOString(),
            },
            Date.now()
          )
          onMessage(mapped)
        } catch {
          // ignore parse error
        }
      })
    },
  })

  return client
}

export function sendChatMessage(
  client: Client,
  payload: { projectId: number; message: string; [key: string]: unknown }
): void {
  if (client.connected) {
    client.publish({
      destination: STOMP_PATHS.publish,
      body: JSON.stringify(payload),
    })
  }
}
