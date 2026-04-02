"use client"

import { useState, useEffect } from "react"
import { useAppStore, type Project, type Role } from "@/lib/store"
import { createProject, joinProject, fetchMyProjects, fetchProjectMembers } from "@/lib/api/projects"
import { getApiBaseUrl } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function ProjectCard({ project }: { project: Project }) {
  const { setCurrentProjectId, setScreen, updateProject } = useAppStore()
  const [showTeam, setShowTeam] = useState(false)
  const [membersLoading, setMembersLoading] = useState(false)

  const relativeTime = getRelativeTime(project.lastUpdated)

  useEffect(() => {
    if (showTeam && project.backendProjectId) {
      setMembersLoading(true)
      fetchProjectMembers(project.backendProjectId)
        .then((apiMembers) => {
          const user = useAppStore.getState().user
          const mapped = apiMembers.map((m, i) => {
            const baseRole = m.role || "Member"
            const role =
              project.role === "Leader" && m.email === user?.email
                ? "Leader"
                : baseRole
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
    }
  }, [showTeam, project.backendProjectId, project.id, updateProject])

  return (
    <>
      <div className="group flex flex-col gap-4 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg text-card-foreground" style={{fontWeight: 600}}>{project.name}</h3>
            {project.topic && (
              <p className="text-sm text-muted-foreground line-clamp-1" style={{fontWeight: 400}}>{project.topic}</p>
            )}
          </div>
          <Badge variant="secondary" className="shrink-0 text-xs" style={{fontWeight: 500}}>
            {project.role}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {project.members.slice(0, 4).map((m) => (
              <Avatar key={m.id} className="h-6 w-6 border-2 border-card">
                <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                  {m.avatar}
                </AvatarFallback>
              </Avatar>
            ))}
            {project.members.length > 4 && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] text-muted-foreground">
                +{project.members.length - 4}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowTeam(true)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {project.members.length}명
          </button>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">{relativeTime}</span>
          <Button
            size="sm"
            onClick={() => {
              setCurrentProjectId(project.id)
              setScreen("chat")
            }}
            className="h-8 text-xs font-medium"
          >
            채팅 열기
          </Button>
        </div>
      </div>

      <Dialog open={showTeam} onOpenChange={setShowTeam}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>팀원 목록</DialogTitle>
            <DialogDescription>{project.name}</DialogDescription>
          </DialogHeader>
          {/* 초대 코드 블록 (채팅 화면과 동일 UX) */}
          <div className="flex flex-col gap-2 rounded-lg bg-muted/50 border border-border/50 p-4 mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              초대 코드
            </span>
            {project.inviteCode ? (
              <>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-lg font-bold tracking-widest text-foreground font-mono truncate">
                    {project.inviteCode}
                  </code>
                </div>
                <p className="text-xs text-muted-foreground">
                  이 코드를 팀원에게 공유하여 프로젝트에 참여하도록 할 수 있습니다.
                </p>
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
            project.members.map((m) => (
              <div key={m.id} className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    {m.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{m.name}</span>
                  <span className="text-xs text-muted-foreground">{m.role}</span>
                </div>
              </div>
            ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function getRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "방금 전"
  if (mins < 60) return `${mins}분 전`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}시간 전`
  const days = Math.floor(hrs / 24)
  return `${days}일 전`
}

export function MainScreen() {
  const { projects, addProject, setScreen, setCurrentProjectId, user, syncProjectsFromApi, updateProject } = useAppStore()

  useEffect(() => {
    if (!getApiBaseUrl()) return
    // persist rehydration 후에 sync 실행 (새로고침 시 대화 내역 유지)
    const t = setTimeout(() => {
      fetchMyProjects()
        .then((apiProjects) => {
            syncProjectsFromApi(apiProjects)
          apiProjects.forEach((p) => {
            fetchProjectMembers(p.id)
              .then((apiMembers) => {
                const mapped = apiMembers.map((m, i) => ({
                  id: m.email || `member-${i}`,
                  name: m.name,
                  role: m.role || "Member",
                  avatar: m.name?.charAt(0) || "?",
                }))
                const proj = useAppStore.getState().projects.find((pr) => pr.backendProjectId === p.id)
                if (proj) {
                  const myMember = apiMembers.find((m) => m.email === user?.email)
                  const myRole =
                    (myMember?.role as Role | undefined) ||
                    (p.role as Role | undefined) ||
                    "Member"
                  updateProject(proj.id, { members: mapped, role: myRole })
                }
              })
              .catch(() => {})
          })
        })
        .catch(() => {})
    }, 150)
    return () => clearTimeout(t)
  }, [syncProjectsFromApi, updateProject, user?.email])
  const [showNew, setShowNew] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [newName, setNewName] = useState("")
  const [createdCode, setCreatedCode] = useState<string | null>(null)
  const [joinCode, setJoinCode] = useState("")
  const [joinError, setJoinError] = useState("")
  const [joinSuccess, setJoinSuccess] = useState(false)
  const [copied, setCopied] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState("")
  const [joinLoading, setJoinLoading] = useState(false)

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreateError("")
    setCreateLoading(true)

    const useApi = !!process.env.NEXT_PUBLIC_API_BASE_URL

    try {
      if (!useApi) throw new Error("NO_API")

      const res = await createProject({
        name: newName.trim(),
        // 프로젝트 제목(name)은 사용자가 입력한 값으로 유지하되,
        // subject(topic)은 채팅 흐름에서 AI가 확정하도록 비워둔다.
        subject: "",
      })
      const project: Project = {
        id: crypto.randomUUID(),
        name: res.name,
        topic: "",
        role: "Leader",
        lastUpdated: new Date(),
        inviteCode: res.inviteCode,
        members: [
          {
            id: "1",
            name: user?.name || "나",
            role: "Leader",
            avatar: user?.avatar || "나",
          },
        ],
        messages: [],
        sessionSummary: {
          title: "",
          goal: "",
          teamSize: "",
          roles: "",
          dueDate: "",
          deliverables: "",
        },
        templateType: [],
        backendProjectId: res.projectId,
      }
      addProject(project)
      setCreatedCode(res.inviteCode)
      setNewName("")
    } catch (err) {
      if (err instanceof Error && err.message === "NO_API") {
        const code = generateCode()
        const project: Project = {
          id: crypto.randomUUID(),
          name: newName.trim(),
          topic: "",
          role: "Leader",
          lastUpdated: new Date(),
          inviteCode: code,
          members: [
            { id: "1", name: user?.name || "나", role: "Leader" as Role, avatar: user?.avatar || "나" },
          ],
          messages: [],
          sessionSummary: { title: "", goal: "", teamSize: "", roles: "", dueDate: "", deliverables: "" },
          templateType: [],
        }
        addProject(project)
        setCreatedCode(code)
        setNewName("")
      } else {
        setCreateError(err instanceof Error ? err.message : "프로젝트 생성에 실패했습니다.")
      }
    } finally {
      setCreateLoading(false)
    }
  }

  const handleJoin = async () => {
    const code = joinCode.trim()
    if (!code) return

    setJoinError("")
    setJoinLoading(true)

    const useApi = !!process.env.NEXT_PUBLIC_API_BASE_URL

    try {
      if (!useApi) throw new Error("NO_API")

      const res = await joinProject({ inviteCode: code })
      let proj = projects.find((p) => p.inviteCode.toLowerCase() === code.toLowerCase())

      if (!proj) {
        proj = {
          id: crypto.randomUUID(),
          name: (res as { name?: string }).name || "프로젝트",
          topic: "",
          role: "Member" as Role,
          lastUpdated: new Date(),
          inviteCode: (res as { inviteCode?: string }).inviteCode || code,
          members: [
            { id: crypto.randomUUID(), name: user?.name || "나", role: "Member" as Role, avatar: user?.avatar || "나" },
          ],
          messages: [],
          sessionSummary: { title: "", goal: "", teamSize: "", roles: "", dueDate: "", deliverables: "" },
          templateType: [],
          backendProjectId: res.projectId,
        }
        useAppStore.getState().addProject(proj)
      } else {
        useAppStore.getState().updateProject(proj.id, {
          members: [
            ...proj.members,
            { id: crypto.randomUUID(), name: user?.name || "나", role: "Member" as Role, avatar: user?.avatar || "나" },
          ],
          backendProjectId: res.projectId,
        })
        proj = { ...proj, backendProjectId: res.projectId }
      }

      setJoinSuccess(true)
      setTimeout(() => {
        setCurrentProjectId(proj!.id)
        setShowJoin(false)
        setJoinCode("")
        setJoinSuccess(false)
        setScreen("chat")
      }, 1500)
    } catch (err) {
      if (err instanceof Error && err.message === "NO_API") {
        const proj = projects.find((p) => p.inviteCode.toLowerCase() === code.toLowerCase())
        if (!proj) {
          setJoinError("유효하지 않은 코드입니다. 팀 리더에게 확인해 주세요.")
        } else {
          setJoinError("")
          setJoinSuccess(true)
          const updatedMembers = [
            ...proj.members,
            { id: crypto.randomUUID(), name: user?.name || "나", role: "Member" as Role, avatar: user?.avatar || "나" },
          ]
          useAppStore.getState().updateProject(proj.id, { members: updatedMembers })
          setTimeout(() => {
            setCurrentProjectId(proj.id)
            setShowJoin(false)
            setJoinCode("")
            setJoinSuccess(false)
            setScreen("chat")
          }, 1500)
        }
      } else {
        const msg = err instanceof Error ? err.message : "프로젝트 참여에 실패했습니다."
        setJoinError(msg)
        if (msg.includes("새로고침") || msg.includes("형식") || msg.includes("일치")) {
          const beforeIds = new Set(projects.map((p) => p.backendProjectId).filter(Boolean))
          fetchMyProjects()
            .then((apiProjects) => {
              syncProjectsFromApi(apiProjects)
              const proj = useAppStore.getState().projects.find((p) => p.backendProjectId && !beforeIds.has(p.backendProjectId))
              if (proj) {
                setJoinError("")
                setCurrentProjectId(proj.id)
                setShowJoin(false)
                setJoinCode("")
                setScreen("chat")
              }
            })
            .catch(() => {})
        }
      }
    } finally {
      setJoinLoading(false)
    }
  }

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="relative mx-auto max-w-4xl px-4 py-8 md:py-12">
      {/* 배경 장식 요소 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-10 right-10 w-72 h-72 rounded-full blur-3xl animate-float opacity-60"
          style={{
            background: 'radial-gradient(circle, rgba(49, 105, 78, 0.1) 0%, rgba(49, 105, 78, 0.05) 40%, transparent 80%)'
          }}
        ></div>
        <div 
          className="absolute bottom-10 left-10 w-80 h-80 rounded-full blur-3xl animate-float-reverse opacity-50"
          style={{
            background: 'radial-gradient(circle, rgba(49, 105, 78, 0.08) 0%, rgba(49, 105, 78, 0.04) 40%, transparent 80%)'
          }}
        ></div>
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-64 rounded-full blur-2xl animate-float opacity-40"
          style={{
            background: 'radial-gradient(ellipse, rgba(49, 105, 78, 0.06) 0%, rgba(49, 105, 78, 0.03) 50%, transparent 90%)',
            animationDelay: '3s'
          }}
        ></div>
      </div>
      
      {/* 히어로 */}
      <div className="relative flex flex-col items-center gap-4 pb-12 text-center">
        <div className="relative">
          <h1 className="text-4xl tracking-tight text-foreground md:text-5xl text-balance" style={{fontWeight: 800}}>
            기획은 줄이고 실행은 앞당기세요
          </h1>
          <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 blur-xl -z-10"></div>
        </div>
        <p className="max-w-md text-lg text-muted-foreground leading-relaxed text-pretty" style={{fontWeight: 400}}>
          프로젝트 세팅을 자동으로 완성해드립니다.
        </p>
        <div className="flex items-center gap-3 pt-4">
          <Button 
            onClick={() => setShowNew(true)} 
            className="h-12 px-8 text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300" 
            style={{fontWeight: 600}}
          >
            새 프로젝트
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowJoin(true)}
            className="h-12 px-8 text-base border-2 hover:bg-primary/5 transition-all duration-300"
            style={{fontWeight: 600}}
          >
            코드로 참여
          </Button>
        </div>
      </div>

      {/* 프로젝트 카드 */}
      {projects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-6xl mx-auto">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 px-8 py-20 backdrop-blur-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
              <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <p className="text-base text-muted-foreground" style={{fontWeight: 600}}>아직 프로젝트가 없습니다</p>
          <p className="text-sm text-muted-foreground" style={{fontWeight: 400}}>새 프로젝트를 만들거나 초대 코드로 참여하세요.</p>
        </div>
      )}

      {/* 새 프로젝트 다이얼로그 */}
      <Dialog
        open={showNew}
        onOpenChange={(open) => {
          setShowNew(open)
          if (!open) {
            setCreatedCode(null)
            setNewName("")
            setCreateError("")
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{createdCode ? "팀원 초대하기" : "새 프로젝트"}</DialogTitle>
            <DialogDescription>
              {createdCode
                ? "새 프로젝트를 시작하기에 앞서, 프로젝트에 팀원을 추가하시겠습니까?"
                : "프로젝트 이름을 입력하여 시작하세요."}
            </DialogDescription>
          </DialogHeader>

          {!createdCode ? (
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="project-name">
                  프로젝트 이름 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="project-name"
                  placeholder="예: 캠퍼스 앱 리디자인"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              {createError && <p className="text-sm text-destructive">{createError}</p>}
              <DialogFooter>
                <Button onClick={handleCreate} disabled={!newName.trim() || createLoading} className="w-full text-base h-11" style={{fontWeight: 600}}>
                  {createLoading ? "생성 중..." : "프로젝트 만들기"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-4">
              <p className="text-sm text-muted-foreground text-center leading-relaxed">
              해당 코드를 팀원에게 공유하고 초대해 보세요!
            </p>
            <div className="flex items-center gap-3 rounded-lg bg-muted px-6 py-3">
                <code className="text-2xl font-bold tracking-widest text-foreground font-mono">{createdCode}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(createdCode)}
                  className="h-8 px-3 text-xs"
                >
                  {copied ? "복사됨" : "복사"}
                </Button>
              </div>
              <DialogFooter className="w-full">
                <Button
                  onClick={() => {
                    const proj = projects.find((p) => p.inviteCode === createdCode)
                    if (proj) {
                      setCurrentProjectId(proj.id)
                      setScreen("chat")
                    }
                    setShowNew(false)
                    setCreatedCode(null)
                  }}
                  className="w-full text-base h-11"
                  style={{fontWeight: 600}}
                >
                  채팅으로 이동
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 프로젝트 참여 다이얼로그 */}
      <Dialog
        open={showJoin}
        onOpenChange={(open) => {
          setShowJoin(open)
          if (!open) {
            setJoinCode("")
            setJoinError("")
            setJoinSuccess(false)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>프로젝트 참여</DialogTitle>
            <DialogDescription>팀 리더에게 받은 초대 코드를 입력하세요.</DialogDescription>
          </DialogHeader>

          {!joinSuccess ? (
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="join-code">초대 코드</Label>
                <Input
                  id="join-code"
                  placeholder="예: ABC123"
                  value={joinCode}
                  onChange={(e) => {
                    setJoinCode(e.target.value.toUpperCase())
                    setJoinError("")
                  }}
                  className="text-center font-mono text-lg tracking-widest uppercase"
                />
                {joinError && <p className="text-sm text-destructive">{joinError}</p>}
              </div>
              <DialogFooter>
                <Button onClick={handleJoin} disabled={!joinCode.trim() || joinLoading} className="w-full text-base h-11" style={{fontWeight: 600}}>
                  {joinLoading ? "참여 중..." : "프로젝트 참여"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <p className="text-sm font-medium text-foreground">참여 완료! 채팅으로 이동합니다...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
