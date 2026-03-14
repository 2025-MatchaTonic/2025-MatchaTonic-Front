"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ExternalLink, Download } from "lucide-react"

interface NotionLinkScreenProps {
  projectId: string
}

export default function NotionLinkScreen({ projectId }: NotionLinkScreenProps) {
  const [notionUrl, setNotionUrl] = useState("")
  const [isValidUrl, setIsValidUrl] = useState(false)
  const router = useRouter()
  const { projects } = useAppStore()
  const [project, setProject] = useState<any>(null)

  useEffect(() => {
    const currentProject = projects.find(p => p.id === projectId)
    setProject(currentProject)
  }, [projectId, projects])

  const validateNotionUrl = (url: string) => {
    const notionPattern = /^https:\/\/[a-zA-Z0-9-]+\.notion\.site\/[a-zA-Z0-9-]+/
    return notionPattern.test(url) || url.includes("notion.so")
  }

  const handleUrlChange = (value: string) => {
    setNotionUrl(value)
    setIsValidUrl(validateNotionUrl(value))
  }

  const handleOpenNotion = () => {
    if (isValidUrl && notionUrl) {
      // 노션 페이지를 새 탭에서 열기
      window.open(notionUrl, '_blank')
    }
  }

  const handleExportTemplate = () => {
    const proj = project ?? projects.find(p => p.id === projectId)
    if (!proj) return
    
    // 프로젝트 데이터를 포함한 템플릿 생성
    const templateData = {
      // 기본 정보
      projectInfo: {
        id: proj.id,
        name: proj.name,
        topic: proj.topic,
        createdAt: proj.createdAt,
        lastUpdated: proj.lastUpdated
      },
      
      // 세션 요약 정보
      sessionSummary: proj.sessionSummary,
      
      // 노션 연결 정보
      notionIntegration: {
        url: notionUrl || null,
        isConnected: isValidUrl && notionUrl ? true : false
      },
      
      // 채팅 히스토리 (AI 메시지만)
      chatHistory: proj.messages?.filter((msg: any) => msg.sender === "ai").map((msg: any) => ({
        text: msg.text,
        timestamp: msg.timestamp
      })) || [],
      
      // 템플릿 메타데이터
      templateMetadata: {
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        templateType: "ProMate Project Template",
        description: "ProMate에서 생성된 프로젝트 템플릿입니다."
      }
    }
    
    const dataStr = JSON.stringify(templateData, null, 2)
    const blob = new Blob([dataStr], { type: "application/json;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    
    const projectName = proj.name || "프로젝트"
    const exportFileDefaultName = `${projectName}-템플릿-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.href = url
    linkElement.download = exportFileDefaultName
    document.body.appendChild(linkElement)
    linkElement.click()
    document.body.removeChild(linkElement)
    URL.revokeObjectURL(url)
  }

  const handleBack = () => {
    useAppStore.getState().setCurrentProjectId(projectId)
    useAppStore.getState().setScreen("chat")
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* 배경 장식 요소들 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float opacity-60" />
        <div className="absolute bottom-32 right-16 w-96 h-96 bg-primary/8 rounded-full blur-3xl animate-float-reverse opacity-40" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-primary/6 rounded-full blur-3xl animate-float opacity-30" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        <div className="w-full max-w-md">
          {/* 뒤로가기 버튼 */}
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-8 p-2 hover:bg-primary/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            채팅으로 돌아가기
          </Button>

          {/* 메인 카드 */}
          <div className="bg-card/80 backdrop-blur-md rounded-2xl shadow-2xl shadow-primary/10 border border-border/50 p-8">
            {/* 헤더 */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ExternalLink className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl text-foreground mb-2" style={{fontWeight: 700}}>
                노션 웹 게시 연결
              </h1>
              <p className="text-muted-foreground text-sm">
                생성된 템플릿을 노션 웹 게시 페이지와 연결해보세요
              </p>
            </div>

            {/* 입력 폼 */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="notion-url" className="text-sm" style={{fontWeight: 600}}>
                  노션 웹 게시 URL
                </Label>
                <Input
                  id="notion-url"
                  type="url"
                  placeholder="https://your-page.notion.site/..."
                  value={notionUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className={`h-12 ${isValidUrl && notionUrl ? 'border-primary/50 bg-primary/5' : ''}`}
                />
                <p className="text-xs text-muted-foreground">
                  노션에서 "웹에 게시" 기능으로 생성된 공개 링크를 입력해주세요
                </p>
              </div>

              {/* URL 유효성 표시 */}
              {notionUrl && (
                <div className={`flex items-center gap-2 text-sm ${isValidUrl ? 'text-primary' : 'text-destructive'}`}>
                  <div className={`w-2 h-2 rounded-full ${isValidUrl ? 'bg-primary' : 'bg-destructive'}`} />
                  {isValidUrl ? '유효한 노션 URL입니다' : '올바른 노션 웹 게시 URL을 입력해주세요'}
                </div>
              )}

              {/* 버튼들 */}
              <div className="space-y-3 pt-4">
                <Button
                  onClick={handleOpenNotion}
                  disabled={!isValidUrl || !notionUrl}
                  className="w-full h-12 text-base flex items-center gap-2"
                  style={{fontWeight: 600}}
                >
                  <ExternalLink className="w-4 h-4" />
                  노션 페이지 열기
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleExportTemplate}
                  disabled={!project && !projects.find(p => p.id === projectId)}
                  className="w-full h-12 text-base flex items-center gap-2"
                  style={{fontWeight: 500}}
                >
                  <Download className="w-4 h-4" />
                  템플릿 내보내기
                </Button>
              </div>
            </div>

            {/* 도움말 */}
            <div className="mt-8 space-y-4">
              <div className="p-4 bg-muted/50 rounded-xl">
                <h3 className="text-sm mb-2" style={{fontWeight: 600}}>
                  💡 노션 웹 게시 방법
                </h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>1. 노션 페이지 우상단 "공유" 버튼 클릭</li>
                  <li>2. "웹에 게시" 토글 활성화</li>
                  <li>3. 생성된 공개 링크 복사하여 입력</li>
                </ul>
              </div>
              
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                <h3 className="text-sm mb-2 text-primary" style={{fontWeight: 600}}>
                  📁 템플릿 내보내기
                </h3>
                <p className="text-xs text-muted-foreground">
                  프로젝트 정보, 세션 요약, 채팅 히스토리를 포함한 완전한 템플릿을 JSON 파일로 내보낼 수 있습니다. 다른 프로젝트에서 재사용하거나 백업용으로 활용하세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}