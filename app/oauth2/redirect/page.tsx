"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { setAuthToken, clearAuthToken } from "@/lib/auth"
import { getApiBaseUrl } from "@/lib/api/client"
import { useAppStore } from "@/lib/store"

function OAuth2RedirectContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const token = searchParams.get("token")
    if (token) {
      setAuthToken(token)
      fetchUserAndRedirect(token)
    } else {
      useAppStore.getState().setScreen("login")
      router.replace("/")
    }
  }, [searchParams, router])

  async function fetchUserAndRedirect(token: string) {
    try {
      const base = getApiBaseUrl() || "https://api.promate.ai.kr"
      const res = await fetch(`${base.replace(/\/$/, "")}/api/users/me`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        if (data?.name || data?.email) {
          useAppStore.getState().setUser({
            name: data.name ?? "",
            email: data.email ?? "",
            avatar: data.avatar ?? data.name?.charAt(0) ?? "?",
          })
          useAppStore.getState().setScreen("main")
          router.replace("/")
          return
        }
      }
    } catch {
      // 에러 시 로그인 화면
    }
    // API 실패 또는 유저 정보 없음 → 로그인 화면으로 (잘못된 토큰 제거)
    clearAuthToken()
    useAppStore.getState().setScreen("login")
    router.replace("/")
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">로그인 처리 중...</p>
    </div>
  )
}

export default function OAuth2RedirectPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">로그인 처리 중...</p>
      </div>
    }>
      <OAuth2RedirectContent />
    </Suspense>
  )
}
