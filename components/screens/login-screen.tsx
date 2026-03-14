"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { fetchCurrentUser } from "@/lib/api/users"
import { buildApiUrl, getApiBaseUrl } from "@/lib/api/client"

export function LoginScreen() {
  const { setUser, setScreen } = useAppStore()
  const [loginLoading, setLoginLoading] = useState(false)

  // OAuth 콜백 후 돌아왔을 때 세션 확인
  useEffect(() => {
    if (!getApiBaseUrl()) return
    fetchCurrentUser()
      .then((data) => {
        if (data?.name || data?.email) {
          setUser({
            name: data.name ?? "",
            email: data.email ?? "",
            avatar: data.avatar ?? data.name?.charAt(0) ?? "?",
          })
          setScreen("main")
        }
      })
      .catch(() => {})
  }, [setUser, setScreen])

  const handleGoogleLogin = () => {
    const apiBase = getApiBaseUrl()
    if (apiBase) {
      setLoginLoading(true)
      window.location.href = buildApiUrl("oauth2/authorization/google")
      return
    }
    // API URL 없을 때 (로컬 개발 폴백)
    const mockUser = { name: "김민수", email: "minsu@university.ac.kr", avatar: "민수" }
    setUser(mockUser)
    setScreen("main")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* 배경 장식 요소 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/4 -left-48 w-[500px] h-[400px] rounded-full blur-3xl animate-float"
          style={{
            background: 'radial-gradient(ellipse, rgba(49, 105, 78, 0.15) 0%, rgba(49, 105, 78, 0.08) 40%, transparent 70%)'
          }}
        ></div>
        <div 
          className="absolute bottom-1/4 -right-48 w-[400px] h-[500px] rounded-full blur-3xl animate-float-reverse"
          style={{
            background: 'radial-gradient(ellipse, rgba(49, 105, 78, 0.12) 0%, rgba(49, 105, 78, 0.06) 40%, transparent 70%)',
            animationDelay: '2s'
          }}
        ></div>
        <div 
          className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full blur-2xl animate-float"
          style={{
            background: 'radial-gradient(circle, rgba(49, 105, 78, 0.08) 0%, rgba(49, 105, 78, 0.04) 50%, transparent 80%)',
            animationDelay: '4s'
          }}
        ></div>
        <div 
          className="absolute bottom-1/3 right-1/3 w-[250px] h-[250px] rounded-full blur-xl animate-float-reverse"
          style={{
            background: 'radial-gradient(circle, rgba(49, 105, 78, 0.06) 0%, rgba(49, 105, 78, 0.03) 60%, transparent 90%)',
            animationDelay: '6s'
          }}
        ></div>
      </div>
      
      <div className="flex w-full max-w-lg flex-col items-center gap-10 relative z-10">
        {/* 로고 */}
        <div className="flex items-center gap-4 relative">
          <div className="relative">
            <Image
              src="/images/logo.png"
              alt="ProMate 로고"
              width={36}
              height={36}
              className="h-9 w-9 drop-shadow-lg"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full blur-xl -z-10"></div>
          </div>
          <span className="text-5xl tracking-tight text-primary font-logo drop-shadow-sm">ProMate</span>
        </div>

        {/* 카드 */}
        <div className="w-full rounded-2xl border border-border/50 bg-card/80 backdrop-blur-md p-8 shadow-2xl shadow-primary/10">
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <h1 className="text-xl text-card-foreground text-balance text-center" style={{fontWeight: 600}}>
                기획은 줄이고 실행은 앞당기세요
              </h1>
              <p className="text-sm text-muted-foreground text-center text-pretty leading-relaxed" style={{fontWeight: 400}}>
                프로젝트 세팅을 자동으로 완성해드립니다.
              </p>
            </div>

            <Button
              onClick={handleGoogleLogin}
              disabled={loginLoading}
              className="w-full gap-3 h-12 text-sm bg-transparent border-2 hover:bg-primary/5 transition-all duration-300 shadow-lg hover:shadow-xl"
              style={{fontWeight: 500}}
              variant="outline"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {loginLoading ? "로그인 중..." : "Google로 계속하기"}
            </Button>

            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              계속 진행하면 서비스 이용약관 및 개인정보 처리방침에 동의하게 됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
