"use client"

import { useState, useEffect, useRef } from "react"
import { useAppStore, type Screen } from "@/lib/store"
import { getAuthToken } from "@/lib/auth"
import { TopNav } from "@/components/top-nav"
import { LoginScreen } from "@/components/screens/login-screen"
import { MainScreen } from "@/components/screens/main-screen"
import { ChatScreen } from "@/components/screens/chat-screen"
import { ExportNotionScreen } from "@/components/screens/export-notion-screen"

const VALID_SCREENS: Screen[] = ["login", "main", "chat", "export-notion"]

function screenFromHash(): Screen | null {
  if (typeof window === "undefined") return null
  const h = window.location.hash.replace("#", "")
  return VALID_SCREENS.includes(h as Screen) ? (h as Screen) : null
}

function readPersistedState() {
  try {
    const raw = localStorage.getItem("promate-storage")
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const s = parsed?.state?.screen
    return {
      screen: (s && VALID_SCREENS.includes(s) ? s : null) as Screen | null,
      user: parsed?.state?.user ?? null,
      currentProjectId: parsed?.state?.currentProjectId ?? null,
    }
  } catch {
    return null
  }
}

export default function Page() {
  const { screen, user, setScreen, setUser } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const skipPushRef = useRef(false)

  // 클라이언트 마운트 + 상태 복원
  useEffect(() => {
    const fromHash = screenFromHash()
    const persisted = readPersistedState()
    const hasToken = !!getAuthToken()
    const storeState = useAppStore.getState()
    const resolvedUser = storeState.user || persisted?.user

    if (resolvedUser && hasToken) {
      if (!storeState.user && persisted?.user) {
        setUser(persisted.user)
      }

      const target = fromHash && fromHash !== "login"
        ? fromHash
        : persisted?.screen && persisted.screen !== "login"
          ? persisted.screen
          : "main"

      if (target === "chat" && persisted?.currentProjectId) {
        useAppStore.getState().setCurrentProjectId(persisted.currentProjectId)
      }

      skipPushRef.current = true
      setScreen(target)
      window.history.replaceState({ screen: target }, "", `/#${target}`)
    } else if (resolvedUser && !hasToken) {
      setUser(null)
      setScreen("login")
    }

    // store 업데이트가 커밋된 후에 mounted 전환
    requestAnimationFrame(() => setMounted(true))
  }, [setScreen, setUser])

  // screen 변경 시 hash 동기화
  useEffect(() => {
    if (!mounted) return
    if (skipPushRef.current) {
      skipPushRef.current = false
      return
    }
    const current = screenFromHash()
    if (screen !== current && screen !== "login") {
      window.history.pushState({ screen }, "", `/#${screen}`)
    }
  }, [screen, mounted])

  // 브라우저 뒤로가기/앞으로가기
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const s = e.state?.screen as Screen | undefined
      if (s && VALID_SCREENS.includes(s)) {
        skipPushRef.current = true
        setScreen(s)
      } else {
        const h = screenFromHash()
        if (h) {
          skipPushRef.current = true
          setScreen(h)
        }
      }
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [setScreen])

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm">로딩 중...</span>
        </div>
      </div>
    )
  }

  // 토큰이 없으면 로그인 화면
  if (!getAuthToken()) {
    return <LoginScreen />
  }

  // 토큰은 있는데 user가 아직 로드 안 됨 → 로딩 (LoginScreen으로 빠지지 않음)
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm">로딩 중...</span>
        </div>
      </div>
    )
  }

  if (screen === "login") {
    return <LoginScreen />
  }

  const isFullHeight = screen === "chat"

  return (
    <div className={`flex flex-col ${isFullHeight ? "h-screen" : "min-h-screen"}`}>
      <TopNav />
      {screen === "main" && <MainScreen />}
      {screen === "chat" && <ChatScreen />}
      {screen === "export-notion" && <ExportNotionScreen />}
    </div>
  )
}
