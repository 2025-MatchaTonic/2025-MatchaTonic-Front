"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { setAuthToken } from "@/lib/auth"
import { getApiBaseUrl } from "@/lib/api/client"
import { useAppStore } from "@/lib/store"

const MOCK_USER = {
  name: "김민수",
  email: "minsu@example.com",
  avatar: "김",
}

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
    const base = getApiBaseUrl() || "https://api.promate.ai.kr"
    const url = `${base.replace(/\/$/, "")}/api/users/me`
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && (data?.name || data?.email)) {
        useAppStore.getState().setUser({
          name: data.name ?? "",
          email: data.email ?? "",
          avatar: data.avatar ?? data.name?.charAt(0) ?? "?",
        })
      } else {
        useAppStore.getState().setUser(MOCK_USER)
      }
    } catch {
      useAppStore.getState().setUser(MOCK_USER)
    }
    useAppStore.getState().setScreen("main")
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
