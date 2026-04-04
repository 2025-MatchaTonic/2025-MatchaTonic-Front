"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { normalizeProjectRole } from "./project-role";
import { parseProjectCreatedAtFromApi } from "./api/projects";

/** localStorage 복원 시 sessionSummary 필드는 항상 문자열로 둔다(ISO 문자열이 Date로 바뀌면 .trim() 등이 깨짐). */
function reviveSessionSummary(raw: unknown): SessionSummary {
  const empty: SessionSummary = {
    title: "",
    goal: "",
    teamSize: "",
    roles: "",
    dueDate: "",
    deliverables: "",
  };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return empty;
  const o = raw as Record<string, unknown>;
  const toStr = (key: keyof SessionSummary): string => {
    const v = o[key as string];
    if (v == null) return "";
    if (v instanceof Date) return v.toISOString();
    return String(v);
  };
  return {
    title: toStr("title"),
    goal: toStr("goal"),
    teamSize: toStr("teamSize"),
    roles: toStr("roles"),
    dueDate: toStr("dueDate"),
    deliverables: toStr("deliverables"),
  };
}

function reviveDates(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string" && /^\d{4}-\d{2}-\d{2}T/.test(obj))
    return new Date(obj);
  if (Array.isArray(obj)) return obj.map(reviveDates);
  if (typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k === "sessionSummary") {
        out[k] = reviveSessionSummary(v);
        continue;
      }
      out[k] =
        k === "timestamp" || k === "lastUpdated" || k === "createdAt"
          ? typeof v === "string"
            ? new Date(v)
            : reviveDates(v)
          : reviveDates(v);
    }
    return out;
  }
  return obj;
}

export type Screen =
  | "login"
  | "main"
  | "new-project"
  | "join-project"
  | "chat"
  | "export-notion";

// 백엔드에서 내려오는 역할 문자열을 그대로 표시하기 위해 넓은 타입 사용
export type Role = string;

export interface TeamMember {
  id: string;
  name: string;
  role: Role;
  avatar: string;
}

export interface MessageButton {
  id: string;
  text: string;
  value: string;
}

export interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
  hasButtons?: boolean;
  buttons?: MessageButton[];
  buttonClicked?: boolean;
  selectedForAnswer?: boolean;
  /** 발신자 이메일 (다른 팀원 메시지 구분용) */
  senderEmail?: string;
  /** 발신자 이름 (표시용) */
  senderName?: string;
}

export interface SessionSummary {
  title: string;
  goal: string;
  teamSize: string;
  roles: string;
  dueDate: string;
  deliverables: string;
}

export interface Project {
  id: string;
  name: string;
  topic: string;
  role: Role;
  lastUpdated: Date;
  /** 프로젝트 생성 시각 (메인 카드 등에 표시). 없으면 lastUpdated로 대체 */
  createdAt?: Date;
  inviteCode: string;
  members: TeamMember[];
  messages: Message[];
  sessionSummary: SessionSummary;
  templateType: string[];
  /** 백엔드 API와 연동 시 사용하는 프로젝트 ID (정수) */
  backendProjectId?: number;
  /** 세션 요약 완료 후 템플릿 안내 AI 메시지를 이미 붙였는지 */
  templateExportOfferShown?: boolean;
}

interface AppState {
  screen: Screen;
  setScreen: (screen: Screen) => void;
  user: { name: string; email: string; avatar: string } | null;
  setUser: (
    user: { name: string; email: string; avatar: string } | null
  ) => void;
  projects: Project[];
  addProject: (project: Project) => void;
  /** 프론트엔드에서 프로젝트를 목록에서 제거 (DB 삭제 API가 별도일 수 있음) */
  removeProject: (id: string) => void;
  currentProjectId: string | null;
  setCurrentProjectId: (id: string | null) => void;
  getCurrentProject: () => Project | undefined;
  updateProject: (id: string, updates: Partial<Project>) => void;
  syncProjectsFromApi: (
    apiProjects: {
      id: number;
      name: string;
      subject: string;
      role: string;
      status: string;
      chatRoomId: number;
    }[]
  ) => void;
  /** 노션 내보내기 시 전달할 세션 요약 (SummaryUpdateRequest와 동일 필드) */
  exportedSummary: SessionSummary | null;
  setExportedSummary: (summary: SessionSummary | null) => void;
  /** localStorage persist 복원이 끝난 뒤 true (복원 전 sync로 요약이 비는 것 방지) */
  _rehydratedFromStorage: boolean;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      screen: "login",
      setScreen: (screen) => set({ screen }),
      user: null,
      setUser: (user) => set({ user }),
      projects: [],
      addProject: (project) =>
        set((state) => ({ projects: [...state.projects, project] })),
      removeProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
        })),
      currentProjectId: null,
      setCurrentProjectId: (id) => set({ currentProjectId: id }),
      getCurrentProject: () => {
        const state = get();
        return state.projects.find((p) => p.id === state.currentProjectId);
      },
      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      syncProjectsFromApi: (
        apiProjects: {
          id: number;
          name: string;
          subject: string;
          role: string;
          status: string;
          chatRoomId: number;
          inviteCode?: string;
        }[]
      ) =>
        set((state) => {
          const emptySummary = {
            title: "",
            goal: "",
            teamSize: "",
            roles: "",
            dueDate: "",
            deliverables: "",
          };
          const existing = state.projects;
          const updated = [...existing];
          for (const api of apiProjects) {
            const serverCreated = parseProjectCreatedAtFromApi(api as object);
            const apiNumericId = Number(api.id);
            const idx = updated.findIndex(
              (p) =>
                p.backendProjectId != null &&
                !Number.isNaN(apiNumericId) &&
                Number(p.backendProjectId) === apiNumericId
            );
            const base = {
              name: api.name,
              topic: api.subject,
              role: normalizeProjectRole(api.role) as Role,
              backendProjectId: Number.isNaN(apiNumericId)
                ? (api.id as number)
                : apiNumericId,
            };
            if (idx >= 0) {
              const prev = updated[idx];
              const prevLast =
                prev.lastUpdated instanceof Date &&
                !Number.isNaN(prev.lastUpdated.getTime())
                  ? prev.lastUpdated
                  : undefined;
              const merged = {
                ...prev,
                ...base,
                lastUpdated: new Date(),
                createdAt:
                  serverCreated ??
                  prev.createdAt ??
                  prevLast,
              };
              if (api.inviteCode) merged.inviteCode = api.inviteCode;
              updated[idx] = merged;
            } else {
              const createdAt = serverCreated ?? new Date();
              updated.push({
                id: crypto.randomUUID(),
                ...base,
                lastUpdated: new Date(),
                createdAt,
                inviteCode: api.inviteCode ?? "",
                members: [],
                messages: [],
                sessionSummary: emptySummary,
                templateType: [],
              });
            }
          }
          return { projects: updated };
        }),
      exportedSummary: null,
      setExportedSummary: (summary) => set({ exportedSummary: summary }),
      _rehydratedFromStorage: false,
    }),
    {
      name: "promate-storage",
      partialize: (state) => ({
        user: state.user,
        screen: state.screen,
        projects: state.projects,
        currentProjectId: state.currentProjectId,
      }),
      onRehydrateStorage: () => (_state, _error) => {
        useAppStore.setState({ _rehydratedFromStorage: true });
      },
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          try {
            const parsed = JSON.parse(str) as {
              state?: unknown;
              version?: number;
            };
            if (parsed?.state != null)
              parsed.state = reviveDates(parsed.state);
            return parsed as { state: unknown; version?: number };
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
