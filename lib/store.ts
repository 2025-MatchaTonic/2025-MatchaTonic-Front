"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

function reviveDates(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj
  if (typeof obj === "string" && /^\d{4}-\d{2}-\d{2}T/.test(obj)) return new Date(obj)
  if (Array.isArray(obj)) return obj.map(reviveDates)
  if (typeof obj === "object") {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) {
      out[k] = k === "timestamp" || k === "lastUpdated" ? (typeof v === "string" ? new Date(v) : reviveDates(v)) : reviveDates(v)
    }
    return out
  }
  return obj
}

export type Screen =
  | "login"
  | "main"
  | "new-project"
  | "join-project"
  | "chat"
  | "export-notion"

export type Role = "Leader" | "Member" | "Designer" | "Developer" | "Researcher"

export interface TeamMember {
  id: string
  name: string
  role: Role
  avatar: string
}

export interface MessageButton {
  id: string
  text: string
  value: string
}

export interface Message {
  id: string
  sender: "user" | "ai"
  text: string
  timestamp: Date
  hasButtons?: boolean
  buttons?: MessageButton[]
  buttonClicked?: boolean
  selectedForAnswer?: boolean
}

export interface SessionSummary {
  title: string
  goal: string
  teamSize: string
  roles: string
  dueDate: string
  deliverables: string
}

export interface Project {
  id: string
  name: string
  topic: string
  role: Role
  lastUpdated: Date
  inviteCode: string
  members: TeamMember[]
  messages: Message[]
  sessionSummary: SessionSummary
  templateType: string[]
  /** 백엔드 API와 연동 시 사용하는 프로젝트 ID (정수) */
  backendProjectId?: number
}

interface AppState {
  screen: Screen
  setScreen: (screen: Screen) => void
  user: { name: string; email: string; avatar: string } | null
  setUser: (user: { name: string; email: string; avatar: string } | null) => void
  projects: Project[]
  addProject: (project: Project) => void
  currentProjectId: string | null
  setCurrentProjectId: (id: string | null) => void
  getCurrentProject: () => Project | undefined
  updateProject: (id: string, updates: Partial<Project>) => void
  syncProjectsFromApi: (apiProjects: { id: number; name: string; subject: string; role: string; status: string; chatRoomId: number }[]) => void
  /** 노션 내보내기 시 사용할 선택된 답변 목록 */
  exportedSelectedAnswers: string[]
  setExportedSelectedAnswers: (answers: string[]) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
  screen: "login",
  setScreen: (screen) => set({ screen }),
  user: null,
  setUser: (user) => set({ user }),
  projects: [],
  addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
  currentProjectId: null,
  setCurrentProjectId: (id) => set({ currentProjectId: id }),
  getCurrentProject: () => {
    const state = get()
    return state.projects.find((p) => p.id === state.currentProjectId)
  },
  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
  syncProjectsFromApi: (apiProjects: { id: number; name: string; subject: string; role: string; status: string; chatRoomId: number; inviteCode?: string }[]) =>
    set((state) => {
      const roleMap = (r: string): import("./store").Role =>
        ["Leader", "Member", "Designer", "Developer", "Researcher"].includes(r) ? (r as import("./store").Role) : "Member"
      const emptySummary = { title: "", goal: "", teamSize: "", roles: "", dueDate: "", deliverables: "" }
      const existing = state.projects
      const updated = [...existing]
      for (const api of apiProjects) {
        const idx = updated.findIndex((p) => p.backendProjectId === api.id)
        const base = {
          name: api.name,
          topic: api.subject,
          role: roleMap(api.role),
          backendProjectId: api.id,
        }
        if (idx >= 0) {
          const merged = { ...updated[idx], ...base, lastUpdated: new Date() }
          if (api.inviteCode) merged.inviteCode = api.inviteCode
          updated[idx] = merged
        } else {
          updated.push({
            id: crypto.randomUUID(),
            ...base,
            lastUpdated: new Date(),
            inviteCode: api.inviteCode ?? "",
            members: [],
            messages: [],
            sessionSummary: emptySummary,
            templateType: [],
          })
        }
      }
      return { projects: updated }
    }),
  exportedSelectedAnswers: [],
  setExportedSelectedAnswers: (answers) => set({ exportedSelectedAnswers: answers }),
}),
    {
      name: "promate-storage",
      partialize: (state) => ({
        user: state.user,
        screen: state.screen,
        projects: state.projects,
        currentProjectId: state.currentProjectId,
      }),
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name)
          if (!str) return null
          try {
            const parsed = JSON.parse(str)
            if (parsed?.state) parsed.state = reviveDates(parsed.state)
            return JSON.stringify(parsed)
          } catch {
            return str
          }
        },
        setItem: (name, value) => localStorage.setItem(name, value),
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
)
