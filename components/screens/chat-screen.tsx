"use client"

import { useState, useRef, useEffect } from "react"
import { useAppStore, type Message, type MessageButton, type SessionSummary } from "@/lib/store"
import { fetchChatMessages, mapChatMessageToAppFormat, sendChatMessageViaApi } from "@/lib/api/chat"
import { fetchProjectMembers, fetchProjectDetails } from "@/lib/api/projects"
import { useChatStomp } from "@/lib/websocket/use-chat-stomp"
import { generateProjectTemplates } from "@/lib/api/ai"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"


function SummaryPanel({ summary, onUpdate }: { summary: SessionSummary; onUpdate: (field: string, value: string) => void }) {
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")

  const fields = [
    { label: "제목", key: "title", value: summary.title },
    { label: "목표", key: "goal", value: summary.goal },
    { label: "팀 인원", key: "teamSize", value: summary.teamSize },
    { label: "역할", key: "roles", value: summary.roles },
    { label: "마감일", key: "dueDate", value: summary.dueDate },
    { label: "산출물", key: "deliverables", value: summary.deliverables },
  ]

  const filledCount = fields.filter((f) => f.value).length

  const handleEdit = (field: { label: string; key: string; value: string }) => {
    setEditingField(field.key)
    setEditValue(field.value || "")
  }

  const handleSave = () => {
    if (editingField) {
      onUpdate(editingField, editValue)
      setEditingField(null)
      setEditValue("")
    }
  }

  const handleCancel = () => {
    setEditingField(null)
    setEditValue("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      handleCancel()
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 shadow-lg shadow-primary/5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm text-card-foreground" style={{fontWeight: 600}}>세션 요약</h3>
        <Badge variant="secondary" className="text-xs">
          {filledCount}/{fields.length}
        </Badge>
      </div>
      <div className="flex flex-col gap-3">
        {fields.map((field) => (
          <div key={field.key} className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {field.label}
            </span>
            {editingField === field.key ? (
              <div className="flex gap-2">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 h-8 text-sm"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="h-8 px-2"
                  style={{fontWeight: 500}}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  className="h-8 px-2"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </Button>
              </div>
            ) : (
              <div 
                className="group flex items-center gap-2 cursor-pointer hover:bg-background/50 rounded px-2 py-1 -mx-2 -my-1 transition-colors"
                onClick={() => handleEdit(field)}
              >
                {field.value ? (
                  <span className="text-sm text-foreground flex-1">{field.value}</span>
                ) : (
                  <span className="text-sm text-muted-foreground/50 italic flex-1">아직 미정</span>
                )}
                <svg 
                  width="12" 
                  height="12" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  className="text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="m18.5 2.5 a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-in slide-in-from-left-2 duration-300">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium bg-primary text-primary-foreground">
        M
      </div>
      <div className="max-w-[80%] rounded-xl px-4 py-2.5 bg-white border border-border/50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-primary/60 rounded-full animate-typing" style={{animationDelay: '0ms'}}></div>
            <div className="w-2 h-2 bg-primary/60 rounded-full animate-typing" style={{animationDelay: '200ms'}}></div>
            <div className="w-2 h-2 bg-primary/60 rounded-full animate-typing" style={{animationDelay: '400ms'}}></div>
          </div>
          <span className="text-xs text-muted-foreground">mates가 입력 중...</span>
        </div>
      </div>
    </div>
  )
}

function ChatMessage({ message, onButtonClick, isSelectable, isSelected, onToggleSelect }: { 
  message: Message; 
  onButtonClick?: (button: MessageButton) => void;
  isSelectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}) {
  const isAI = message.sender === "ai"
  const { user } = useAppStore()
  const isMe = !isAI && (message.senderEmail === user?.email || !message.senderEmail)
  const isRight = isMe
  const avatarChar = isAI ? "M" : isMe ? "나" : (message.senderName?.charAt(0) || "?")
  const senderLabel = isAI ? null : isMe ? null : (message.senderName || "팀원")
  
  return (
    <div className={`flex gap-3 ${isRight ? "flex-row-reverse" : ""} animate-in slide-in-from-bottom-2 duration-500`}>
      {isSelectable && (
        <div className="flex items-center shrink-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
          />
        </div>
      )}
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
          isAI
            ? "bg-primary text-primary-foreground"
            : isMe
              ? "bg-muted text-muted-foreground"
              : "bg-blue-100 text-blue-700"
        }`}
      >
        {avatarChar}
      </div>
      <div className={`max-w-[80%] flex flex-col gap-1 ${isRight ? "items-end" : "items-start"}`}>
        {senderLabel && (
          <span className="text-xs text-muted-foreground px-1" style={{ fontWeight: 500 }}>
            {senderLabel}
          </span>
        )}
        <div
          className={`rounded-xl px-4 py-2.5 text-sm leading-relaxed shadow-sm border ${
            isAI
              ? "bg-white text-foreground border-border/50"
              : isMe
                ? "bg-primary/10 text-foreground border-primary/20"
                : "bg-white text-foreground border-border/50"
          } ${isSelected ? "ring-2 ring-primary/50 ring-offset-2" : ""}`}
        >
          {message.text.split('\n').map((line, index) => (
            <div key={index}>
              {line.split(/(@mates)/g).map((part, partIndex) => 
                part === '@mates' ? (
                  <span key={partIndex} className="bg-primary/20 text-primary px-1 py-0.5 rounded text-xs font-medium">
                    @mates
                  </span>
                ) : (
                  part
                )
              )}
              {index < message.text.split('\n').length - 1 && <br />}
            </div>
          ))}
        </div>
        
        {message.hasButtons && !message.buttonClicked && message.buttons && (
          <div className="flex gap-2 mt-1">
            {message.buttons.map((button) => (
              <Button
                key={button.id}
                variant="outline"
                size="sm"
                onClick={() => onButtonClick?.(button)}
                className="h-8 px-3 text-xs bg-white hover:bg-primary/5 border-primary/30"
                style={{fontWeight: 500}}
              >
                {button.text}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function ChatScreen() {
  const { getCurrentProject, updateProject, setScreen, setCurrentProjectId, setExportedSelectedAnswers, user } = useAppStore()
  const project = getCurrentProject()

  const [input, setInput] = useState("")
  const [showConfirm, setShowConfirm] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [showHistory, setShowHistory] = useState(true)
  const [isAiTyping, setIsAiTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const hasInitialized = useRef(false)
  const [inputKey, setInputKey] = useState(0)
  const [showTemplateOptions, setShowTemplateOptions] = useState(false)
  const [selectedTemplateTypes, setSelectedTemplateTypes] = useState<string[]>([])
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [membersLoading, setMembersLoading] = useState(false)
  const [inviteCodeLoading, setInviteCodeLoading] = useState(false)
  const [inviteCodeCopied, setInviteCodeCopied] = useState(false)

  const { connected: stompConnected, send: stompSend } = useChatStomp(
    project?.backendProjectId,
    project?.id ?? ""
  )

  // 백엔드 API: 팀원 목록 조회 (화면 로드 시 1회 + 모달 열릴 때)
  const membersFetchedRef = useRef(false)
  useEffect(() => {
    if (!project?.backendProjectId) return
    if (membersFetchedRef.current && !showTeamModal) return
    membersFetchedRef.current = true

    setMembersLoading(true)
    fetchProjectMembers(project.backendProjectId)
      .then((apiMembers) => {
        const currentUser = useAppStore.getState().user
        const mapped = apiMembers.map((m, i) => {
          let role = (["Leader", "Member", "Designer", "Developer", "Researcher"].includes(m.role) ? m.role : "Member") as import("@/lib/store").Role
          if (project.role === "Leader" && m.email === currentUser?.email) role = "Leader"
          return {
            id: m.email || `member-${i}`,
            name: m.name,
            role,
            avatar: m.name?.charAt(0) || "?",
          }
        })
        updateProject(project.id, { members: mapped })
      })
      .catch(() => {})
      .finally(() => setMembersLoading(false))
  }, [showTeamModal, project?.backendProjectId, project?.id, project?.role, updateProject])

  // 백엔드 API: 초대 코드 조회 (화면 로드 시 1회)
  const inviteCodeFetchedRef = useRef(false)
  useEffect(() => {
    if (!project?.backendProjectId || inviteCodeFetchedRef.current) return
    inviteCodeFetchedRef.current = true

    setInviteCodeLoading(true)
    fetchProjectDetails(project.backendProjectId)
      .then((details) => {
        if (details?.inviteCode) {
          updateProject(project.id, { inviteCode: details.inviteCode })
        }
      })
      .catch(() => {})
      .finally(() => setInviteCodeLoading(false))
  }, [project?.backendProjectId, project?.id, updateProject])

  // 백엔드 API: 과거 채팅 내역 조회
  // API가 빈 배열을 반환해도 기존(persist) 메시지를 덮어쓰지 않음
  useEffect(() => {
    if (!project?.backendProjectId) return

    let cancelled = false
    setIsLoadingHistory(true)

    fetchChatMessages(project.backendProjectId)
      .then((apiMessages) => {
        if (cancelled) return
        const mapped = apiMessages.map((m, i) => mapChatMessageToAppFormat(m, i))

        if (mapped.length > 0) {
          // API에 데이터가 있으면 병합 (기존 메시지 유지, content 기준 중복 제거)
          const latest = useAppStore.getState().projects.find((p) => p.id === project.id)
          const existing = latest?.messages ?? project.messages
          const key = (m: Message) => `${m.timestamp.getTime()}-${m.senderEmail ?? ""}-${m.text}`
          const existingKeys = new Set(existing.map(key))
          const fromApi = mapped.filter((m) => !existingKeys.has(key(m)))
          const merged = [...existing, ...fromApi].sort(
            (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
          )
          updateProject(project.id, {
            messages: merged,
            lastUpdated: new Date(),
          })
        }
        // mapped.length === 0이면 기존 메시지 그대로 유지 (덮어쓰지 않음)
      })
      .catch((err) => {
        if (!cancelled) console.warn("채팅 내역 조회 실패:", err)
      })
      .finally(() => {
        if (!cancelled) setIsLoadingHistory(false)
      })

    return () => {
      cancelled = true
    }
  }, [project?.id, project?.backendProjectId])

  // AI 질문 대기 중인지 확인 (텍스트 답변이 필요한 경우)
  const lastAiIndex = project?.messages 
    ? project.messages.reduce((last, m, i) => m.sender === "ai" ? i : last, -1)
    : -1
  const lastAiMsg = lastAiIndex >= 0 ? project?.messages[lastAiIndex] : null
  const isAnswerMode = lastAiMsg && lastAiMsg.sender === "ai" && 
    (!lastAiMsg.hasButtons || lastAiMsg.buttonClicked) &&
    !lastAiMsg.text.includes("템플릿 생성") && !lastAiMsg.text.includes("핵심 내용을 모두 수집")
  
  const selectableMessages = isAnswerMode && lastAiIndex >= 0
    ? project!.messages.filter((m, i) => m.sender === "user" && i > lastAiIndex)
    : []
  const selectedMessages = selectableMessages.filter(m => m.selectedForAnswer)
  const hasSelectedMessages = selectedMessages.length > 0

  const handleToggleSelect = (msgId: string) => {
    if (!project) return
    const updated = project.messages.map(m => 
      m.id === msgId ? { ...m, selectedForAnswer: !m.selectedForAnswer } : m
    )
    updateProject(project.id, { messages: updated, lastUpdated: new Date() })
  }

  const handleSubmitSelected = () => {
    if (!project || !hasSelectedMessages || isAiTyping) return
    const combinedText = selectedMessages.map(m => m.text).join("\n\n") + " @mates"
    clearInput()
    handleSendWithText(combinedText, true)
  }

  const handleButtonClick = (button: MessageButton) => {
    if (!project) return
    
    // 노션 링크 버튼 처리 - 노션 내보내기로 이동
    if (button.id === "notion-link") {
      const summary = project.sessionSummary
      const answers = [
        summary.title,
        summary.goal,
        summary.teamSize,
        summary.roles,
        summary.dueDate,
        summary.deliverables,
      ].filter(Boolean)
      setExportedSelectedAnswers(answers)
      setCurrentProjectId(project.id)
      setScreen("export-notion")
      return
    }

    // 템플릿 내보내기 버튼 처리
    if (button.id === "export-template") {
      // 버튼 클릭된 상태로 업데이트
      const updatedMessages = project.messages.map(msg => 
        msg.hasButtons && !msg.buttonClicked ? { ...msg, buttonClicked: true } : msg
      )
      
      // 사용자 응답 메시지 추가
      const userMsg: Message = {
        id: crypto.randomUUID(),
        sender: "user",
        text: button.value,
        timestamp: new Date(),
        senderEmail: user?.email,
        senderName: user?.name,
      }
      
      updateProject(project.id, {
        messages: [...updatedMessages, userMsg],
        lastUpdated: new Date(),
      })

      // 템플릿 타입 선택 모달 표시
      setTimeout(() => {
        setShowTemplateOptions(true)
      }, 500)
      
      return
    }

    // 나중에 버튼 처리
    if (button.id === "skip-export") {
      // 버튼 클릭된 상태로 업데이트
      const updatedMessages = project.messages.map(msg => 
        msg.hasButtons && !msg.buttonClicked ? { ...msg, buttonClicked: true } : msg
      )
      
      // 사용자 응답 메시지 추가
      const userMsg: Message = {
        id: crypto.randomUUID(),
        sender: "user",
        text: button.value,
        timestamp: new Date(),
        senderEmail: user?.email,
        senderName: user?.name,
      }

      updateProject(project.id, {
        messages: [...updatedMessages, userMsg],
        lastUpdated: new Date(),
      })

      // AI 응답 메시지
      setTimeout(() => {
        setIsAiTyping(true)
        
        setTimeout(() => {
          const aiMsg: Message = {
            id: crypto.randomUUID(),
            sender: "ai",
            text: "알겠습니다. 언제든지 필요하실 때 템플릿을 내보내실 수 있습니다.\n추가로 도움이 필요하시면 @mates를 태그해주세요.",
            timestamp: new Date(),
          }

          const latest = useAppStore.getState().projects.find((p) => p.id === project.id)
          if (latest) {
            updateProject(project.id, {
              messages: [...latest.messages, aiMsg],
              lastUpdated: new Date(),
            })
          }
          
          setIsAiTyping(false)
        }, 1500)
      }, 800)
      
      return
    }
    
    const updatedMessages = project.messages.map(msg => 
      msg.hasButtons && !msg.buttonClicked ? { ...msg, buttonClicked: true } : msg
    )
    
    const userMsg: Message = {
      id: crypto.randomUUID(),
      sender: "user",
      text: button.value,
      timestamp: new Date(),
      senderEmail: user?.email,
      senderName: user?.name,
    }
    
    updateProject(project.id, {
      messages: [...updatedMessages, userMsg],
      lastUpdated: new Date(),
    })

    // 예/아니오 버튼 → 답변을 백엔드 AI에 전송하여 본격 대화 시작
    if (button.id === "yes" || button.id === "no") {
      const messageToSend = `@mates ${button.value}`
      if (project.backendProjectId) {
        if (stompConnected && stompSend) {
          stompSend(messageToSend)
        } else {
          sendChatMessageViaApi(project.backendProjectId, messageToSend, user?.email, user?.name)
            .catch((err) => console.warn("[REST 폴백] 전송 실패:", err))
        }
      }
    }
  }

  // 첫 진입 시 인사 메시지 + 주제 질문 (메시지가 없을 때만)
  useEffect(() => {
    const shouldInit =
      project &&
      project.messages.length === 0 &&
      !hasInitialized.current &&
      (!project.backendProjectId || !isLoadingHistory)

    if (shouldInit) {
      hasInitialized.current = true
      setIsAiTyping(true)

      setTimeout(() => {
        const latest = useAppStore.getState().projects.find((p) => p.id === project.id)
        if (latest && latest.messages.length > 0) {
          setIsAiTyping(false)
          return
        }

        const greetingMsg: Message = {
          id: crypto.randomUUID(),
          sender: "ai",
          text: "안녕하세요 저는 mates입니다.\n도움이 필요하시면 @mates를 태그해주세요.",
          timestamp: new Date(),
        }

        const existingMessages = latest?.messages ?? []
        updateProject(project.id, {
          messages: [...existingMessages, greetingMsg],
          lastUpdated: new Date(),
        })

        setTimeout(() => {
          setIsAiTyping(true)

          setTimeout(() => {
            const latest2 = useAppStore.getState().projects.find((p) => p.id === project.id)
            if (!latest2) { setIsAiTyping(false); return }

            const questionMsg: Message = {
              id: crypto.randomUUID(),
              sender: "ai",
              text: "프로젝트를 시작하기에 앞서 아래 질문에 답해주세요\n지금 준비하고 있는 프로젝트 주제가 있나요?",
              timestamp: new Date(),
              hasButtons: true,
              buttons: [
                { id: "yes", text: "예", value: "예, 프로젝트 주제가 있습니다" },
                { id: "no", text: "아니오", value: "아니오, 아직 주제가 없습니다" },
              ],
            }

            updateProject(project.id, {
              messages: [...latest2.messages, questionMsg],
              lastUpdated: new Date(),
            })
            setIsAiTyping(false)
          }, 1500)
        }, 800)

        setIsAiTyping(false)
      }, 1500)
    }
  }, [project, updateProject, isLoadingHistory])

  // 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [project?.messages.length])


  if (!project) return null

  const handleSendWithText = (userText: string, clearSelections?: boolean) => {
    if (!userText || isAiTyping) return

    const baseMessages = clearSelections
      ? project.messages.map((m) => ({ ...m, selectedForAnswer: false }))
      : project.messages

    const userMsg: Message = {
      id: crypto.randomUUID(),
      sender: "user",
      text: userText,
      timestamp: new Date(),
      senderEmail: user?.email,
      senderName: user?.name,
    }

    // 백엔드로 메시지 전송: WebSocket 우선, 미연결 시 REST API 폴백
    if (project.backendProjectId) {
      if (stompConnected && stompSend) {
        stompSend(userText)
      } else {
        sendChatMessageViaApi(project.backendProjectId, userText, user?.email, user?.name)
          .catch((err) => console.warn("[REST 폴백] 전송 실패:", err))
      }
    }

    // 사용자 메시지 추가 (AI 응답은 백엔드 WebSocket으로 수신)
    updateProject(project.id, {
      messages: [...baseMessages, userMsg],
      lastUpdated: new Date(),
    })
  }

  const handleSummaryUpdate = (field: string, value: string) => {
    if (!project) return
    
    const updatedSummary = { ...project.sessionSummary, [field]: value }
    updateProject(project.id, {
      sessionSummary: updatedSummary,
      lastUpdated: new Date(),
    })
  }

  const clearInput = () => {
    setInput("")
    if (inputRef.current) {
      inputRef.current.value = ""
    }
    setTimeout(() => inputRef.current?.focus(), 0)
    // 입력창 강제 리렌더
    setInputKey(prev => prev + 1)
    
    // 여러 단계로 확실히 초기화
    setTimeout(() => {
      setInput("")
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }, 0)
    
    setTimeout(() => {
      setInput("")
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }, 50)
  }

  const handleSend = () => {
    const trimmedInput = input.trim()
    if (!trimmedInput || isAiTyping) return
    
    // 즉시 입력창 초기화
    clearInput()
    
    // 그 다음 메시지 처리
    handleSendWithText(trimmedInput)
  }

  const summaryFields = [
    { label: "제목", value: project.sessionSummary.title },
    { label: "목표", value: project.sessionSummary.goal },
    { label: "팀 인원", value: project.sessionSummary.teamSize },
    { label: "역할", value: project.sessionSummary.roles },
    { label: "마감일", value: project.sessionSummary.dueDate },
    { label: "산출물", value: project.sessionSummary.deliverables },
  ]

  const missingFields = summaryFields.filter((f) => !f.value)


  const handleTemplateTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setSelectedTemplateTypes(prev => [...prev, type])
    } else {
      setSelectedTemplateTypes(prev => prev.filter(t => t !== type))
    }
  }

  const handleTemplateGenerate = async () => {
    if (selectedTemplateTypes.length === 0) return
    
    setShowTemplateOptions(false)
    setIsGeneratingTemplate(true)
    updateProject(project.id, { templateType: selectedTemplateTypes, lastUpdated: new Date() })
    
    const loadingMsg: Message = {
      id: crypto.randomUUID(),
      sender: "ai",
      text: "템플릿 생성중입니다...",
      timestamp: new Date(),
    }
    
    updateProject(project.id, {
      messages: [...project.messages, loadingMsg],
      lastUpdated: new Date(),
    })

    const addCompleteMessage = () => {
      const latest = useAppStore.getState().projects.find((p) => p.id === project.id)
      if (!latest) return
      const completeMsg: Message = {
        id: crypto.randomUUID(),
        sender: "ai",
        text: "템플릿 생성을 완료했습니다! 🎉",
        timestamp: new Date(),
        hasButtons: true,
        buttons: [
          { id: "notion-link", text: "노션 웹 게시 바로가기", value: "notion-link" }
        ]
      }
      updateProject(project.id, {
        messages: [...latest.messages, completeMsg],
        lastUpdated: new Date(),
      })
      setIsGeneratingTemplate(false)
    }

    if (project.backendProjectId && process.env.NEXT_PUBLIC_API_BASE_URL) {
      const summary = project.sessionSummary
      const selectedAnswers = [
        summary.title,
        summary.goal,
        summary.teamSize,
        summary.roles,
        summary.dueDate,
        summary.deliverables,
      ].filter(Boolean)
      try {
        await generateProjectTemplates({
          projectId: project.backendProjectId,
          selectedAnswers,
        })
        addCompleteMessage()
      } catch {
        setTimeout(addCompleteMessage, 1500)
      }
    } else {
      setTimeout(addCompleteMessage, 3000)
    }
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* 좌측 사이드바 */}
      <div className={`${showHistory ? 'w-80' : 'w-16'} shrink-0 border-r border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 ease-in-out`}>
        {/* 팀원목록 버튼 */}
        <div className="p-4 border-b border-border/50">
          <Button
            onClick={() => setShowTeamModal(true)}
            variant="outline"
            className={`w-full h-10 transition-all duration-300 ${showHistory ? 'justify-start gap-2' : 'justify-center px-0'}`}
            style={{fontWeight: 500}}
            title={!showHistory ? `팀원목록 (${project.members.length})` : undefined}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            {showHistory && (
              <span className="transition-opacity duration-300">
                팀원목록 ({project.members.length})
              </span>
            )}
          </Button>
        </div>

        {/* 핵심 결정사항 */}
        <div className="p-4">
          <div className={`flex items-center mb-3 ${showHistory ? 'justify-between' : 'justify-center'}`}>
            {showHistory && (
              <h3 className="text-sm text-foreground transition-opacity duration-300" style={{fontWeight: 600}}>
                핵심 결정사항
              </h3>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="h-6 w-6 p-0"
              title={showHistory ? "접기" : "펼치기"}
            >
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                className={`transition-transform duration-300 ${showHistory ? 'rotate-180' : ''}`}
              >
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </Button>
          </div>
          
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showHistory ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="space-y-2">
              {summaryFields.filter((f) => f.value).map((f) => (
                <div 
                  key={f.label}
                  className="p-2 rounded-lg bg-background/50 border border-border/30 hover:bg-background/80 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0"></div>
                    <span className="text-xs text-muted-foreground" style={{fontWeight: 500}}>
                      {f.label}
                    </span>
                  </div>
                  <p className="text-xs text-foreground line-clamp-2 pl-4" style={{fontWeight: 400}}>
                    {f.value}
                  </p>
                </div>
              ))}
              {summaryFields.filter((f) => f.value).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  아직 결정된 항목이 없습니다
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 채팅 영역 */}
      <div className="flex flex-1 flex-col">
        {/* 채팅 헤더 */}
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 bg-card/30 backdrop-blur-sm">
          <div className="flex flex-col">
            <h2 className="text-sm text-foreground" style={{fontWeight: 600}}>{project.name}</h2>
            <p className="text-xs text-muted-foreground">
              mates와 함께 프로젝트를 계획해보세요
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSummary(!showSummary)}
              className="text-xs md:hidden"
            >
              요약
            </Button>
            <div className="flex items-center gap-2">
              {project?.backendProjectId && (
                <span
                  className={`text-xs ${stompConnected ? "text-green-600" : "text-muted-foreground"}`}
                  title={stompConnected ? "실시간 연결됨" : "연결 대기 중"}
                >
                  {stompConnected ? "●" : "○"}
                </span>
              )}
              <Badge variant="outline" className="text-xs">
                진행중
              </Badge>
            </div>
          </div>
        </div>

        {/* 모바일 요약 */}
        {showSummary && (
          <div className="border-b border-border p-4 md:hidden">
            <SummaryPanel summary={project.sessionSummary} onUpdate={handleSummaryUpdate} />
          </div>
        )}

        {/* 메시지 */}
        <div className="flex-1 overflow-y-auto px-3 py-4 md:px-4">
          <div className="mx-auto flex max-w-4xl flex-col gap-4 w-full">
            {isLoadingHistory && project.messages.length === 0 && (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                채팅 내역을 불러오는 중...
              </div>
            )}
            {project.messages.map((msg) => (
              <ChatMessage 
                key={msg.id} 
                message={msg} 
                onButtonClick={handleButtonClick}
                isSelectable={selectableMessages.some(m => m.id === msg.id)}
                isSelected={!!msg.selectedForAnswer}
                onToggleSelect={selectableMessages.some(m => m.id === msg.id) ? () => handleToggleSelect(msg.id) : undefined}
              />
            ))}
            {isAiTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 입력 */}
        <div className="border-t border-border px-3 py-3 md:px-4">
          <div className="mx-auto flex max-w-4xl flex-col gap-2 w-full">
            {hasSelectedMessages && (
              <Button
                onClick={handleSubmitSelected}
                disabled={isAiTyping}
                className="w-full bg-primary hover:bg-primary/90 font-medium"
              >
                선택한 답변 제출하기 ({selectedMessages.length}개)
              </Button>
            )}
            {input.includes("@mates") && (
              <div className="flex items-center gap-2 text-xs text-primary bg-primary/10 px-3 py-2 rounded-lg">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4"/>
                  <circle cx="12" cy="12" r="9"/>
                </svg>
                <span style={{fontWeight: 500}}>mates가 호출되었습니다</span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setInput((prev) => (prev.includes("@mates") ? prev : prev ? `${prev} @mates ` : "@mates "))
                inputRef.current?.focus()
              }}
              className="h-8 text-xs font-medium shrink-0 self-start"
            >
              mates 호출하기
            </Button>
            <div className="flex items-center gap-2">
              <Input
                key={inputKey}
                ref={inputRef}
                placeholder="@mates를 태그해서 AI에게 질문하세요..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    const currentValue = e.currentTarget.value.trim()
                    if (currentValue && !isAiTyping) {
                      // 즉시 입력창 초기화
                      clearInput()
                      
                      // 그 다음 메시지 처리
                      handleSendWithText(currentValue)
                    }
                  }
                }}
                className={`flex-1 ${input.includes("@mates") ? "border-primary/50 focus:border-primary" : ""}`}
              />
              <Button 
                onClick={handleSend} 
                disabled={!input.trim()} 
                size="sm" 
                className={`h-9 px-4 font-medium transition-all ${
                  input.includes("@mates")
                    ? "bg-primary hover:bg-primary/90 shadow-lg" 
                    : ""
                }`}
              >
                전송
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 우측 요약 사이드바 */}
      <aside className="w-80 shrink-0 overflow-y-auto border-l border-border/50 bg-card/30 backdrop-blur-sm p-5">
        <SummaryPanel summary={project.sessionSummary} onUpdate={handleSummaryUpdate} />
        {showConfirm && (
          <Button
            onClick={() => setShowConfirm(true)}
            className="mt-4 w-full"
            style={{fontWeight: 500}}
          >
            검토 및 확인
          </Button>
        )}
      </aside>

      {/* 템플릿 타입 선택 모달 */}
      <Dialog open={showTemplateOptions} onOpenChange={setShowTemplateOptions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>템플릿 타입 선택</DialogTitle>
            <DialogDescription>
              해당 프로젝트는 기획용인가요, 개발용인가요?
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="planning"
                checked={selectedTemplateTypes.includes("planning")}
                onChange={(e) => handleTemplateTypeChange("planning", e.target.checked)}
                className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
              />
              <label htmlFor="planning" className="text-sm font-medium text-foreground cursor-pointer">
                기획용 템플릿
              </label>
            </div>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="development"
                checked={selectedTemplateTypes.includes("development")}
                onChange={(e) => handleTemplateTypeChange("development", e.target.checked)}
                className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
              />
              <label htmlFor="development" className="text-sm font-medium text-foreground cursor-pointer">
                개발용 템플릿
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button 
              onClick={handleTemplateGenerate} 
              disabled={selectedTemplateTypes.length === 0}
              className="w-full"
              style={{fontWeight: 600}}
            >
              템플릿 생성하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 팀원목록 모달 */}
      <Dialog open={showTeamModal} onOpenChange={setShowTeamModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>팀원목록</DialogTitle>
            <DialogDescription>
              {project.name} 프로젝트에 참여중인 팀원들입니다.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2 rounded-lg bg-muted/50 border border-border/50 p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">초대 코드</span>
            {inviteCodeLoading ? (
              <p className="text-sm text-muted-foreground py-2">불러오는 중...</p>
            ) : project.inviteCode ? (
              <>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-lg font-bold tracking-widest text-foreground font-mono truncate">
                    {project.inviteCode}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(project.inviteCode)
                      setInviteCodeCopied(true)
                      setTimeout(() => setInviteCodeCopied(false), 2000)
                    }}
                    className="shrink-0 h-8 px-3 text-xs"
                  >
                    {inviteCodeCopied ? "복사됨" : "복사"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">팀원에게 공유하여 프로젝트에 참여하도록 할 수 있습니다.</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-2">
                초대 코드를 불러올 수 없습니다.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 py-2">
            {membersLoading ? (
              <p className="text-sm text-muted-foreground py-4 text-center">팀원 목록을 불러오는 중...</p>
            ) : (
            project.members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/30">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm" style={{fontWeight: 600}}>
                  {member.avatar}
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-sm text-foreground" style={{fontWeight: 500}}>{member.name}</span>
                  <span className="text-xs text-muted-foreground">{member.role}</span>
                </div>
                {member.role === "Leader" && (
                  <div className="px-2 py-1 rounded-full bg-primary/20 text-primary text-xs" style={{fontWeight: 500}}>
                    리더
                  </div>
                )}
              </div>
            ))
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowTeamModal(false)} className="w-full" style={{fontWeight: 500}}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 확인 다이얼로그 */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>프로젝트 세부사항 확인</DialogTitle>
            <DialogDescription>
              다음 항목이 포함되었는지 확인해 주세요: 제목, 목표, 팀 인원, 역할, 마감일, 산출물.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2">
            {summaryFields.map((f) => (
              <div key={f.label} className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    f.value ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {f.value ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <circle cx="12" cy="12" r="1" />
                    </svg>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground">{f.label}</span>
                  <span className="text-sm text-foreground">{f.value || "미입력"}</span>
                </div>
              </div>
            ))}
          </div>

          {missingFields.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {missingFields.length}개 항목이 비어있습니다. 그대로 진행하거나 돌아가서 수정할 수 있습니다.
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              수정
            </Button>
            <Button
              onClick={() => {
                setShowConfirm(false)
                setShowTemplateOptions(true)
              }}
              className="font-medium"
            >
              확인 완료
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
