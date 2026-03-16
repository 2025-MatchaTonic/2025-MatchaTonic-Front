"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"

/**
 * /oauth2/callback - 백엔드가 이 경로로 리다이렉트할 경우 /oauth2/redirect로 전달
 */
export default function OAuth2CallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const query = searchParams.toString()
    const hash = typeof window !== "undefined" ? window.location.hash : ""
    const redirect = `/oauth2/redirect${query ? `?${query}` : ""}${hash}`
    router.replace(redirect)
  }, [searchParams, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">로그인 처리 중...</p>
    </div>
  )
}
