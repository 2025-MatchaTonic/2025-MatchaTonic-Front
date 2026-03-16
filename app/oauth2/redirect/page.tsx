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
    const setUserFromData = (data: { name?: string; email?: string; avatar?: string }) => {
      useAppStore.getState().setUser({
        name: data.name ?? "",
        email: data.email ?? "",
        avatar: data.avatar ?? data.name?.charAt(0) ?? "?",
      })
    }

    // 1) 쿠키 시도 (리다이렉트 시 백엔드가 세션 쿠키 설정했을 수 있음)
    try {
      const resCookie = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })
      const dataCookie = await resCookie.json().catch(() => ({}))
      if (resCookie.ok && (dataCookie?.name || dataCookie?.email)) {
        setUserFromData(dataCookie)
        useAppStore.getState().setScreen("main")
        router.replace("/")
        return
      }
    } catch {
      /* 다음 시도 */
    }

    // 2) Bearer 토큰 시도
    const authAttempts: { headers: Record<string, string> }[] = [
      { headers: { Authorization: `Bearer ${token}` } },
      { headers: { "X-Auth-Token": token } },
    ]
    for (const { headers } of authAttempts) {
      try {
        const res = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json", ...headers },
          credentials: "include",
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok && (data?.name || data?.email)) {
          setUserFromData(data)
          useAppStore.getState().setScreen("main")
          router.replace("/")
          return
        }
      } catch {
        /* 다음 시도 */
      }
    }

    useAppStore.getState().setUser(MOCK_USER)
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
