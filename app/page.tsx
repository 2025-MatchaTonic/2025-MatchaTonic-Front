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
  const { screen, user, setScreen, setUser } = useAppStore()
  const skipPushRef = useRef(false)

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

  // 최초 로드: URL hash에서 화면 복원
  useEffect(() => {
    const fromHash = screenFromHash()
    if (fromHash && fromHash !== "login") {
      skipPushRef.current = true
      setScreen(fromHash)
      window.history.replaceState({ screen: fromHash }, "", `/#${fromHash}`)
    } else if (screen !== "login") {
      window.history.replaceState({ screen }, "", `/#${screen}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // screen 변경 시 hash 동기화 (popstate에 의한 변경은 제외)
  useEffect(() => {
    if (skipPushRef.current) {
      skipPushRef.current = false
      return
    }
    if (typeof window === "undefined") return
    const current = screenFromHash()
    if (screen !== current && screen !== "login") {
      window.history.pushState({ screen }, "", `/#${screen}`)
    }
  }, [screen])

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

  // 토큰 없이 user만 있으면(저장소 불일치) 로그아웃 처리
  useEffect(() => {
    if (user && !getAuthToken()) {
      setUser(null)
      navigateTo("login")
    }
  }, [user, setUser, navigateTo])

  // 로그인 필수: user 없이 main 등에 있으면 로그인 화면으로
  useEffect(() => {
    if (!user && screen !== "login") {
      navigateTo("login")
    }
  }, [user, screen, navigateTo])

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
