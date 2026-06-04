"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  exportProjectToNotion,
  mapFrontendTemplateTypes,
} from "@/lib/api/projects"
import {
  hasSummaryContent,
  summaryToNonEmptyUpdateRequest,
  updateProjectSummary,
} from "@/lib/api/summary"

export function ExportNotionScreen() {
  const { setScreen, getCurrentProject, exportedSummary } = useAppStore()
  const project = getCurrentProject()
  const [notionLink, setNotionLink] = useState("")
  const [linkError, setLinkError] = useState("")
  const [exporting, setExporting] = useState(false)
  const [exportDone, setExportDone] = useState(false)
  const [exportPending, setExportPending] = useState(false)
  const [exportDoneMessage, setExportDoneMessage] = useState("")
  const [exportResultUrl, setExportResultUrl] = useState<string | null>(null)
  const [exportError, setExportError] = useState("")

  const isValidNotionLink = (link: string) => {
    return link.includes("notion.so/") || link.includes("notion.site/")
  }

  const handleExport = async () => {
    setExportError("")
    setLinkError("")

    if (!isValidNotionLink(notionLink)) {
      setLinkError(
        "올바른 Notion 페이지 링크를 입력하세요 (예: https://www.notion.so/your-page)"
      )
      return
    }

    const summarySource =
      exportedSummary && hasSummaryContent(exportedSummary)
        ? exportedSummary
        : project && hasSummaryContent(project.sessionSummary)
          ? project.sessionSummary
          : null

    if (project?.backendProjectId) {
      setExporting(true)
      try {
        if (summarySource) {
          const savePayload = summaryToNonEmptyUpdateRequest(summarySource)
          if (Object.keys(savePayload).length > 0) {
            await updateProjectSummary(project.backendProjectId, savePayload)
          }
        }
        const result = await exportProjectToNotion({
          projectId: project.backendProjectId,
          pageUrl: notionLink.trim(),
          templateType: mapFrontendTemplateTypes(project.templateType ?? []),
          content: "노션보내기 요청",
        })
        setExportResultUrl(notionLink.trim())
        setExportPending(result.status === "accepted")
        setExportDoneMessage(result.message)
        setExportDone(true)
      } catch (err) {
        setExportError(
          err instanceof Error ? err.message : "보내기에 실패했습니다."
        )
      } finally {
        setExporting(false)
      }
      return
    }

    setExporting(true)
    setTimeout(() => {
      setExportResultUrl(notionLink)
      setExportPending(false)
      setExportDoneMessage("노션 페이지 링크가 저장되었습니다.")
      setExportDone(true)
      setExporting(false)
    }, 1500)
  }

  if (exportDone) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8 md:py-16">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-primary"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-foreground">
              {exportPending ? "노션 생성 중" : "보내기 완료"}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {exportDoneMessage ||
                (exportPending
                  ? "노션 생성 중입니다. 잠시 후 노션을 확인해주세요."
                  : "프로젝트 템플릿이 Notion에 생성되었습니다.")}
            </p>
            {exportPending && (
              <p className="text-xs text-muted-foreground">
                생성에는 1~2분 정도 걸릴 수 있습니다. Notion 페이지를
                새로고침해 확인해 주세요.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {(exportResultUrl || notionLink) && (
              <Button asChild className="font-medium">
                <a
                  href={exportResultUrl || notionLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Notion에서 열기
                </a>
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setScreen("main")}
            className="text-muted-foreground"
          >
            프로젝트 목록으로
          </Button>
        </div>
      </main>
    )
  }

  if (exporting) {
    return (
      <main className="relative mx-auto max-w-lg px-4 py-8 md:py-16 min-h-[60vh] flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-40 animate-float"
            style={{
              background:
                "radial-gradient(circle, rgba(49, 105, 78, 0.15) 0%, transparent 70%)",
            }}
          />
        </div>

        <div className="relative w-full max-w-sm rounded-2xl border border-border/50 bg-card/80 backdrop-blur-md p-10 shadow-xl shadow-primary/5">
          <div className="flex flex-col items-center gap-8">
            <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-base text-foreground" style={{ fontWeight: 600 }}>
                Notion으로보내는 중
              </p>
              <p className="text-xs text-muted-foreground">
                잠시만 기다려주세요
              </p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8 md:py-16">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-foreground">Notion으로보내기</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            템플릿을 생성할 Notion 페이지 링크를 붙여넣으세요. 요청이 접수되면
            1~2분 뒤 해당 페이지에서 결과를 확인할 수 있습니다.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="notion-link">Notion 페이지 링크</Label>
            <Input
              id="notion-link"
              placeholder="https://www.notion.so/your-page"
              value={notionLink}
              onChange={(e) => {
                setNotionLink(e.target.value)
                setLinkError("")
              }}
            />
            {linkError && (
              <p className="text-sm text-destructive">{linkError}</p>
            )}
          </div>

          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Notion Integration에 해당 페이지(또는 상위 페이지) 접근 권한이
              있어야 합니다. 웹에 공유된 편집 가능한 페이지 URL을 사용하세요.
            </p>
          </div>

          {exportError && (
            <p className="text-sm text-destructive">{exportError}</p>
          )}
          <Button
            onClick={handleExport}
            disabled={exporting || !notionLink.trim()}
            className="h-11 font-medium"
          >
            {exporting ? "보내는 중..." : "보내기 시작"}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setScreen("chat")}
            className="text-muted-foreground"
          >
            채팅으로 돌아가기
          </Button>
        </div>
      </div>
    </main>
  )
}
