"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { exportProjectToNotion } from "@/lib/api/projects"

export function ExportNotionScreen() {
  const { setScreen, getCurrentProject, exportedSelectedAnswers } = useAppStore()
  const project = getCurrentProject()
  const [notionLink, setNotionLink] = useState("")
  const [linkError, setLinkError] = useState("")
  const [exporting, setExporting] = useState(false)
  const [exportDone, setExportDone] = useState(false)
  const [exportResultUrl, setExportResultUrl] = useState<string | null>(null)
  const [exportError, setExportError] = useState("")

  const isValidNotionLink = (link: string) => {
    return link.includes("notion.so/") || link.includes("notion.site/")
  }

  const handleExport = async () => {
    setExportError("")

    if (project?.backendProjectId && exportedSelectedAnswers.length > 0) {
      setExporting(true)
      try {
        const url = await exportProjectToNotion({
          projectId: project.backendProjectId,
          selectedAnswers: exportedSelectedAnswers,
        })
        setExportResultUrl(url || null)
        setExportDone(true)
      } catch (err) {
        setExportError(err instanceof Error ? err.message : "내보내기에 실패했습니다.")
      } finally {
        setExporting(false)
      }
      return
    }

    if (!isValidNotionLink(notionLink)) {
      setLinkError("올바른 Notion 페이지 링크를 입력하세요 (예: https://notion.so/your-page)")
      return
    }
    setLinkError("")
    setExporting(true)
    setTimeout(() => {
      setExportResultUrl(notionLink)
      setExportDone(true)
      setExporting(false)
    }, 2500)
  }

  if (exportDone) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8 md:py-16">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-foreground">내보내기 완료</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              프로젝트 템플릿이 Notion에 성공적으로 내보내졌습니다.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {(exportResultUrl || notionLink) && (
              <Button asChild className="font-medium">
                <a href={exportResultUrl || notionLink} target="_blank" rel="noopener noreferrer">
                  Notion에서 열기
                </a>
              </Button>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setScreen("main")} className="text-muted-foreground">
            프로젝트 목록으로
          </Button>
        </div>
      </main>
    )
  }

  if (exporting) {
    return (
      <main className="relative mx-auto max-w-lg px-4 py-8 md:py-16 min-h-[60vh] flex items-center justify-center">
        {/* 배경 장식 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-40 animate-float"
            style={{ background: 'radial-gradient(circle, rgba(49, 105, 78, 0.15) 0%, transparent 70%)' }}
          />
          <div 
            className="absolute top-1/3 right-1/4 w-40 h-40 rounded-full blur-2xl opacity-30 animate-float-reverse"
            style={{ background: 'radial-gradient(circle, rgba(49, 105, 78, 0.12) 0%, transparent 70%)' }}
          />
        </div>

        <div className="relative w-full max-w-sm rounded-2xl border border-border/50 bg-card/80 backdrop-blur-md p-10 shadow-xl shadow-primary/5">
          <div className="flex flex-col items-center gap-8">
            {/* 스피너 */}
            <div className="relative flex items-center justify-center">
              <div 
                className="absolute h-14 w-14 rounded-full opacity-20"
                style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)' }}
              />
              <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>

            {/* 텍스트 */}
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-base text-foreground" style={{ fontWeight: 600 }}>
                Notion으로 내보내는 중
              </p>
              <p className="text-xs text-muted-foreground">
                잠시만 기다려주세요
              </p>
            </div>

            {/* 진행 인디케이터 */}
            <div className="w-full h-1.5 rounded-full bg-muted/80 overflow-hidden">
              <div 
                className="h-full w-1/3 min-w-[80px] rounded-full bg-primary/80 animate-progress-indeterminate"
              />
            </div>
          </div>
        </div>
      </main>
    )
  }

  const useApiExport = !!(project?.backendProjectId && exportedSelectedAnswers.length > 0)

  return (
    <main className="mx-auto max-w-lg px-4 py-8 md:py-16">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-foreground">Notion으로 내보내기</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {useApiExport
              ? "AI 분석 결과를 Notion으로 내보냅니다."
              : "템플릿을 내보낼 공개 Notion 페이지 링크를 붙여넣으세요."}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {!useApiExport && (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="notion-link">Notion 페이지 링크</Label>
                <Input
                  id="notion-link"
                  placeholder="https://notion.so/your-page"
                  value={notionLink}
                  onChange={(e) => {
                    setNotionLink(e.target.value)
                    setLinkError("")
                  }}
                />
                {linkError && <p className="text-sm text-destructive">{linkError}</p>}
              </div>

              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Notion 페이지가 &quot;웹에 공유&quot; 및 편집 권한으로 설정되어 있거나, Notion 워크스페이스가 연결되어 있는지 확인하세요.
                </p>
              </div>
            </>
          )}

          {exportError && <p className="text-sm text-destructive">{exportError}</p>}
          <Button
            onClick={handleExport}
            disabled={
              project?.backendProjectId && exportedSelectedAnswers.length > 0
                ? exporting
                : !notionLink.trim()
            }
            className="h-11 font-medium"
          >
            {exporting ? "내보내는 중..." : "내보내기 시작"}
          </Button>

          <Button variant="ghost" size="sm" onClick={() => setScreen("chat")} className="text-muted-foreground">
            채팅으로 돌아가기
          </Button>
        </div>
      </div>
    </main>
  )
}
