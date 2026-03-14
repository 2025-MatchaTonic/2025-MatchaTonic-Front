"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"

const TEMPLATES = [
  {
    id: "planning",
    label: "기획",
    description: "프로젝트 헌장, 마일스톤, 작업 보드, 회의록, 리서치 문서를 포함합니다.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: "development",
    label: "개발",
    description: "GitHub README, 기여 가이드, 브랜치 전략, CI/CD 설정, 기술 스택 문서를 포함합니다.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
      </svg>
    ),
  },
]

export function TemplateSelectScreen() {
  const { getCurrentProject, updateProject, setScreen } = useAppStore()
  const project = getCurrentProject()
  const [selected, setSelected] = useState<string[]>([])

  if (!project) return null

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const handleGenerate = () => {
    updateProject(project.id, { templateType: selected })
    setScreen("template-generating")
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 md:py-12">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-foreground">템플릿 선택</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            프로젝트에 생성할 템플릿 유형을 하나 이상 선택하세요.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {TEMPLATES.map((t) => {
            const isSelected = selected.includes(t.id)
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggle(t.id)}
                className={`flex items-start gap-4 rounded-xl border-2 p-5 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {t.icon}
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-foreground">{t.label}</span>
                  <span className="text-sm text-muted-foreground leading-relaxed">{t.description}</span>
                </div>
                <div className="ml-auto mt-1 shrink-0">
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                      isSelected ? "border-primary bg-primary" : "border-border"
                    }`}
                  >
                    {isSelected && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-primary-foreground">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <Button
          onClick={handleGenerate}
          disabled={selected.length === 0}
          className="h-11 font-medium"
        >
          템플릿 생성
        </Button>
      </div>
    </main>
  )
}
