"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { setAuthToken } from "@/lib/auth"
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
      const base = process.env.NEXT_PUBLIC_API_BASE_URL
      if (!base) {
        useAppStore.getState().setScreen("main")
        router.replace("/")
        return
      }
      const res = await fetch(`${base}/api/users/me`, {
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
        }
      }
    } catch {
      // 에러 시에도 메인으로 (토큰은 저장됨)
    } finally {
      useAppStore.getState().setScreen("main")
      router.replace("/")
    }
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
