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

export default function Page() {
  const { screen, user, setScreen, setUser } = useAppStore()
  const [mounted, setMounted] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const skipPushRef = useRef(false)

  // 클라이언트 마운트 + 상태 복원
  useEffect(() => {
    const fromHash = screenFromHash()
    let persistedScreen: Screen | null = null
    let persistedUser: typeof user = null
    let persistedProjectId: string | null = null
    try {
      const raw = localStorage.getItem("promate-storage")
      if (raw) {
        const parsed = JSON.parse(raw)
        const s = parsed?.state?.screen
        if (s && VALID_SCREENS.includes(s)) persistedScreen = s as Screen
        if (parsed?.state?.user) persistedUser = parsed.state.user
        if (parsed?.state?.currentProjectId) persistedProjectId = parsed.state.currentProjectId
      }
    } catch { /* ignore */ }

    const storeState = useAppStore.getState()
    const resolvedUser = storeState.user || persistedUser
    const hasToken = !!getAuthToken()

    if (resolvedUser && hasToken) {
      if (!storeState.user && persistedUser) setUser(persistedUser)

      const target = fromHash && fromHash !== "login"
        ? fromHash
        : persistedScreen && persistedScreen !== "login"
          ? persistedScreen
          : "main"

      if (target === "chat" && persistedProjectId) {
        useAppStore.getState().setCurrentProjectId(persistedProjectId)
      }

      skipPushRef.current = true
      setScreen(target)
      window.history.replaceState({ screen: target }, "", `/#${target}`)
      setHasSession(true)
    } else if (resolvedUser && !hasToken) {
      setUser(null)
      setScreen("login")
    }

    setMounted(true)
  }, [setScreen, setUser])

  // hasSession인데 user hook이 아직 안 따라왔으면 3초 후 포기
  useEffect(() => {
    if (!mounted || !hasSession || user) return
    const timer = setTimeout(() => setHasSession(false), 3000)
    return () => clearTimeout(timer)
  }, [mounted, hasSession, user])

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

  // 마운트 전 또는 세션 복원 대기 중 → 로딩
  if (!mounted || (hasSession && !user)) {
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
