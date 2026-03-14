"use client"

import { useAppStore } from "@/lib/store"
import { TopNav } from "@/components/top-nav"
import { LoginScreen } from "@/components/screens/login-screen"
import { MainScreen } from "@/components/screens/main-screen"
import { ChatScreen } from "@/components/screens/chat-screen"
import { ExportNotionScreen } from "@/components/screens/export-notion-screen"

export default function Page() {
  const { screen } = useAppStore()

  if (screen === "login") {
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
