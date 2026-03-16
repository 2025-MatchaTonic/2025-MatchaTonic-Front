"use client"

import { useAppStore, type Screen } from "@/lib/store"
import { clearAuthToken } from "@/lib/auth"
import { getApiBaseUrl } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Image from "next/image"

export function TopNav() {
  const { user, setUser, setScreen, screen } = useAppStore()

  if (!user) return null

  const navItems: { label: string; screen: Screen }[] = [
    { label: "MAIN", screen: "main" },
  ]

  return (
    <header className="sticky top-0 z-50 grid h-20 grid-cols-3 items-center border-b border-border/50 bg-card/70 px-4 backdrop-blur-md shadow-sm md:px-6">
      {/* 좌측: 메인 탭 */}
      <nav className="flex items-center gap-1">
        {navItems.map((item) => (
          <Button
            key={item.screen}
            variant={screen === item.screen ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setScreen(item.screen)}
            className="text-sm"
            style={{fontWeight: 600}}
          >
            {item.label}
          </Button>
        ))}
      </nav>

      {/* 중앙: 로고 */}
      <button
        type="button"
        onClick={() => setScreen("main")}
        className="flex items-center justify-center gap-2"
      >
        <Image
          src="/images/logo.png"
          alt="ProMate 로고"
          width={24}
          height={24}
          className="h-6 w-6"
        />
        <span className="text-3xl tracking-tight text-primary font-logo">ProMate</span>
      </button>

      {/* 우측: 사용자 탭 */}
      <div className="flex items-center justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 px-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                  {user.avatar}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm md:inline" style={{fontWeight: 500}}>{user.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="flex flex-col items-start gap-0.5">
              <span className="text-sm font-medium">{user.name}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                clearAuthToken()
                setUser(null)
                setScreen("login")
                const base = getApiBaseUrl()
                const useBackendLogout = process.env.NEXT_PUBLIC_USE_BACKEND_LOGOUT !== "false"
                if (base && useBackendLogout && typeof window !== "undefined") {
                  const redirectUri = encodeURIComponent(window.location.origin + "/")
                  window.location.href = `${base.replace(/\/$/, "")}/logout?post_logout_redirect_uri=${redirectUri}`
                }
              }}
              className="text-destructive focus:text-destructive"
            >
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
