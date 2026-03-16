"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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

export default function Page() {
  const { screen, user, setScreen, setUser } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const skipPushRef = useRef(false)

  // 클라이언트 마운트 감지 + 화면 복원
  useEffect(() => {
    setMounted(true)

    // persist된 화면 상태 복원 (localStorage 직접 읽기 - rehydration 타이밍에 의존하지 않음)
    const fromHash = screenFromHash()
    let persistedScreen: Screen | null = null
    try {
      const raw = localStorage.getItem("promate-storage")
      if (raw) {
        const parsed = JSON.parse(raw)
        const s = parsed?.state?.screen
        if (s && VALID_SCREENS.includes(s)) persistedScreen = s as Screen
      }
    } catch { /* ignore */ }

    const { user: u } = useAppStore.getState()
    const hasToken = !!getAuthToken()
    const hasUser = !!(u || (persistedScreen && persistedScreen !== "login"))

    if (hasUser && hasToken) {
      const target = fromHash && fromHash !== "login"
        ? fromHash
        : persistedScreen && persistedScreen !== "login"
          ? persistedScreen
          : "main"
      skipPushRef.current = true
      setScreen(target)
      window.history.replaceState({ screen: target }, "", `/#${target}`)
    } else if (u && !hasToken) {
      setUser(null)
      setScreen("login")
    }
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
        const fromHash = screenFromHash()
        if (fromHash) {
          skipPushRef.current = true
          setScreen(fromHash)
        }
      }
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [setScreen])

  // SSR/hydration 전이면 빈 화면
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

  if (screen === "login" || !user) {
    return <LoginScreen />
  }

  const fullHeightScreens = ["chat"]
  const isFullHeight = fullHeightScreens.includes(screen)

  return (
    <div className={`flex flex-col ${isFullHeight ? "h-screen" : "min-h-screen"}`}>
      <TopNav />
      {screen === "main" && <MainScreen />}
      {screen === "chat" && <ChatScreen />}
      {screen === "export-notion" && <ExportNotionScreen />}
    </div>
  )
}
