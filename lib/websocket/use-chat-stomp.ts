"use client"

import { useEffect, useRef, useState } from "react"
import {
  createChatStompClient,
  sendChatMessage,
  type Client,
} from "./chat-stomp"
import { useAppStore } from "@/lib/store"
import type { Message } from "@/lib/store"

export function useChatStomp(
  projectId: number | undefined,
  projectStoreId: string
) {
  const updateProject = useAppStore((s) => s.updateProject)
  const clientRef = useRef<Client | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!projectId) return

    const client = createChatStompClient(projectId, (msg) => {
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
      sendChatMessage(clientRef.current, {
        projectId,
        message,
      })
    }
  }

  return { connected, send }
}
