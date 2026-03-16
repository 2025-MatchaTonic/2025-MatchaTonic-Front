"use client"

import { useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { getAuthToken } from "@/lib/auth"
import { TopNav } from "@/components/top-nav"
import { LoginScreen } from "@/components/screens/login-screen"
import { MainScreen } from "@/components/screens/main-screen"
import { ChatScreen } from "@/components/screens/chat-screen"
import { ExportNotionScreen } from "@/components/screens/export-notion-screen"

export default function Page() {
  const { screen, user, setScreen, setUser } = useAppStore()

  // 토큰 없이 user만 있으면(저장소 불일치) 로그아웃 처리
  useEffect(() => {
    if (user && !getAuthToken()) {
      setUser(null)
      setScreen("login")
    }
  }, [user, setUser, setScreen])

  // 로그인 필수: user 없이 main 등에 있으면 로그인 화면으로
  useEffect(() => {
    if (!user && screen !== "login") {
      setScreen("login")
    }
  }, [user, screen, setScreen])

  if (screen === "login" || !user) {
    return <LoginScreen />
  }

  // Screens that are full-height with TopNav
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
