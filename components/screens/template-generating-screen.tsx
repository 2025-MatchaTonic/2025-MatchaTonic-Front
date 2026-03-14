"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"

const STEPS = [
  { label: "분석 중", description: "프로젝트 세부사항 및 요구사항을 읽고 있습니다..." },
  { label: "구조화 중", description: "문서 아웃라인을 구성하고 있습니다..." },
  { label: "조립 중", description: "페이지 콘텐츠를 생성하고 있습니다..." },
  { label: "완료", description: "템플릿이 준비되었습니다." },
]

const LOG_MESSAGES = [
  "세션 요약 분석 중...",
  "팀 역할 및 책임 파악 중...",
  "산출물을 템플릿 섹션에 매핑 중...",
  "프로젝트 헌장 아웃라인 생성 중...",
  "마일스톤 구조 생성 중...",
  "작업 보드 카테고리 구축 중...",
  "회의록 템플릿 작성 중...",
  "README 구조 조립 중...",
  "기여 가이드라인 추가 중...",
  "문서 계층 구조 확정 중...",
  "템플릿 조립이 완료되었습니다.",
]

export function TemplateGeneratingScreen() {
  const { setScreen } = useAppStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    let logIndex = 0
    const logInterval = setInterval(() => {
      if (logIndex < LOG_MESSAGES.length) {
        setLogs((prev) => [...prev, LOG_MESSAGES[logIndex]])
        logIndex++
      }
    }, 500)

    const stepTimers = [
      setTimeout(() => setCurrentStep(1), 1500),
      setTimeout(() => setCurrentStep(2), 3500),
      setTimeout(() => setCurrentStep(3), 5500),
    ]

    return () => {
      clearInterval(logInterval)
      stepTimers.forEach(clearTimeout)
    }
  }, [])

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 md:py-12">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-foreground">템플릿 생성 중</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            AI가 프로젝트 템플릿을 만들고 있습니다. 보통 몇 초면 완료됩니다.
          </p>
        </div>

        {/* 단계 표시 */}
        <div className="flex flex-col gap-0">
          {STEPS.map((step, i) => {
            const isActive = i === currentStep
            const isDone = i < currentStep
            return (
              <div key={step.label} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                      isDone
                        ? "border-primary bg-primary text-primary-foreground"
                        : isActive
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {isDone ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    ) : (
                      <span className="text-xs font-medium">{i + 1}</span>
                    )}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`h-8 w-0.5 transition-colors duration-300 ${
                        isDone ? "bg-primary" : "bg-border"
                      }`}
                    />
                  )}
                </div>
                <div className="flex flex-col gap-0.5 pb-6">
                  <span
                    className={`text-sm font-medium transition-colors ${
                      isDone || isActive ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{step.description}</span>
                  {isActive && currentStep < 3 && (
                    <div className="mt-2 flex gap-1">
                      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary delay-75" style={{ animationDelay: "150ms" }} />
                      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary delay-150" style={{ animationDelay: "300ms" }} />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* 스트리밍 로그 */}
        <div className="rounded-xl border border-border bg-foreground/[0.03] p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground">실시간 출력</span>
          </div>
          <div className="h-40 overflow-y-auto font-mono text-xs leading-5 text-muted-foreground">
            {logs.map((log, i) => (
              <div key={`${log}-${i}`} className="flex gap-2">
                <span className="text-muted-foreground/50">$</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>

        {currentStep === 3 && (
          <Button onClick={() => setScreen("export-notion")} className="h-11 font-medium">
            템플릿 미리보기
          </Button>
        )}
      </div>
    </main>
  )
}
