"use client"

import { useEffect, useRef, useState } from "react"
import {
  createChatStompClient,
  sendChatMessage,
  type Client,
} from "./chat-stomp"
import { useAppStore } from "@/lib/store"
import type { Message } from "@/lib/store"

const RECENT_SENT_TTL = 5000

export function useChatStomp(
  projectId: number | undefined,
  projectStoreId: string
) {
  const updateProject = useAppStore((s) => s.updateProject)
  const clientRef = useRef<Client | null>(null)
  const [connected, setConnected] = useState(false)
  const recentSentRef = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    if (!projectId) return

    const client = createChatStompClient(projectId, (msg) => {
      const { user } = useAppStore.getState()

      // 1) senderEmail로 내 메시지 판별
      if (msg.senderEmail && user?.email && msg.senderEmail === user.email) {
        return
      }

      // 2) senderEmail이 없을 때: 최근 내가 보낸 텍스트와 동일하면 에코로 판단
      const now = Date.now()
      const sentMap = recentSentRef.current
      if (sentMap.has(msg.text)) {
        const sentAt = sentMap.get(msg.text)!
        if (now - sentAt < RECENT_SENT_TTL) {
          sentMap.delete(msg.text)
          return
        }
      }

      const latest = useAppStore.getState().projects.find((p) => p.id === projectStoreId)
      if (latest) {
        updateProject(projectStoreId, {
          messages: [...latest.messages, msg],
          lastUpdated: new Date(),
        })
      }
    })

    const origOnConnect = client.onConnect
    client.onConnect = () => {
      setConnected(true)
      origOnConnect?.()
    }
    client.onDisconnect = () => setConnected(false)
    client.onStompError = () => setConnected(false)

    clientRef.current = client
    client.activate()

    return () => {
      client.deactivate()
      clientRef.current = null
      setConnected(false)
    }
  }, [projectId, projectStoreId, updateProject])

  const send = (message: string) => {
    if (clientRef.current?.connected && projectId) {
      const { user } = useAppStore.getState()
      recentSentRef.current.set(message, Date.now())
      sendChatMessage(clientRef.current, {
        type: "TALK",
        projectId,
        message,
        senderEmail: user?.email ?? "",
        senderName: user?.name ?? "",
      })
    }
  }

  return { connected, send }
}
