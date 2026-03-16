"use client"

import { useEffect, useRef, useCallback } from "react"
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
  const { screen, user, setScreen, setUser, _hasHydrated } = useAppStore()
  const skipPushRef = useRef(false)
  const initializedRef = useRef(false)

  const navigateTo = useCallback(
    (s: Screen) => {
      setScreen(s)
      if (typeof window !== "undefined") {
        const hash = s === "login" ? "" : `#${s}`
        window.history.pushState({ screen: s }, "", `/${hash}`)
      }
    },
    [setScreen]
  )

  // hydration 완료 후 한 번만: hash에서 화면 복원 + 인증 체크
  useEffect(() => {
    if (!_hasHydrated || initializedRef.current) return
    initializedRef.current = true

    const fromHash = screenFromHash()
    const restoredScreen = fromHash && fromHash !== "login" ? fromHash : screen

    if (user && getAuthToken()) {
      skipPushRef.current = true
      setScreen(restoredScreen === "login" ? "main" : restoredScreen)
      const target = restoredScreen === "login" ? "main" : restoredScreen
      window.history.replaceState({ screen: target }, "", `/#${target}`)
    } else if (user && !getAuthToken()) {
      setUser(null)
      setScreen("login")
    }
  }, [_hasHydrated, screen, user, setScreen, setUser])

  // screen 변경 시 hash 동기화 (popstate 또는 초기화에 의한 변경은 제외)
  useEffect(() => {
    if (!_hasHydrated) return
    if (skipPushRef.current) {
      skipPushRef.current = false
      return
    }
    if (typeof window === "undefined") return
    const current = screenFromHash()
    if (screen !== current && screen !== "login") {
      window.history.pushState({ screen }, "", `/#${screen}`)
    }
  }, [screen, _hasHydrated])

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

  // hydration 전이면 빈 화면 (깜빡임 방지)
  if (!_hasHydrated) {
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
