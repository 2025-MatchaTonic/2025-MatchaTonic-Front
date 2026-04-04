/**
 * 프로젝트 관련 API
 * - GET /api/projects/me: 내 프로젝트 목록 조회
 * - GET /api/projects/{projectId}/members: 팀원 목록 조회
 * - POST /api/projects: 새 프로젝트 생성
 * - POST /api/projects/join: 초대 코드로 참여
 * - POST /api/projects/{projectId}/export: AI 분석 및 노션 내보내기
 */

import { apiRequest } from "./request"
import type { SummaryUpdateRequest } from "./summary"

export interface MyProjectResponse {
  id: number
  name: string
  subject: string
  role: string
  status: string
  chatRoomId: number
  inviteCode?: string
  /** 백엔드에 따라 createdAt, created_at, createDate 등으로 올 수 있음 */
  createdAt?: string
}

/**
 * GET /api/projects/me 등 프로젝트 객체에서 생성 시각 필드를 찾아 파싱합니다.
 */
export function parseProjectCreatedAtFromApi(row: object): Date | undefined {
  if (!row || typeof row !== "object") return undefined
  const r = row as Record<string, unknown>
  const keys = [
    "createdAt",
    "created_at",
    "createDate",
    "createdDate",
    "creationTime",
    "createdTime",
    "regDate",
    "registerDate",
    "gmtCreate",
    "gmt_create",
  ]
  for (const k of keys) {
    const v = r[k]
    if (v == null) continue
    if (typeof v === "number") {
      const ms = v < 1e12 ? v * 1000 : v
      const d = new Date(ms)
      if (!Number.isNaN(d.getTime())) return d
    }
    if (typeof v === "string" && v.trim()) {
      const d = new Date(v.trim())
      if (!Number.isNaN(d.getTime())) return d
    }
  }
  return undefined
}

export async function fetchMyProjects(): Promise<MyProjectResponse[]> {
  const res = await apiRequest("/api/projects/me", { method: "GET" })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`프로젝트 목록 조회 실패: ${res.status} ${text}`)
  }

  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export interface ProjectMemberResponse {
  name: string
  email: string
  role: string
}

export async function fetchProjectMembers(projectId: number): Promise<ProjectMemberResponse[]> {
  const res = await apiRequest(`/api/projects/${projectId}/members`, { method: "GET" })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`팀원 목록 조회 실패: ${res.status} ${text}`)
  }

  const data = await res.json()
  if (Array.isArray(data)) return data as ProjectMemberResponse[]
  if (data && Array.isArray((data as { content?: unknown[] }).content))
    return (data as { content: ProjectMemberResponse[] }).content
  if (data && Array.isArray((data as { data?: unknown[] }).data))
    return (data as { data: ProjectMemberResponse[] }).data
  if (data && Array.isArray((data as { members?: unknown[] }).members))
    return (data as { members: ProjectMemberResponse[] }).members
  return []
}

export interface ProjectDetailsResponse {
  id?: number
  projectId?: number
  name?: string
  subject?: string
  inviteCode?: string
  [key: string]: unknown
}

/** 프로젝트 상세 조회 (초대 코드 등) - 백엔드에 GET /api/projects/{projectId} 지원 필요 */
export async function fetchProjectDetails(projectId: number): Promise<ProjectDetailsResponse | null> {
  const res = await apiRequest(`/api/projects/${projectId}`, { method: "GET" })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    console.warn(`[프로젝트 상세] 조회 실패: ${res.status} ${text}`)
    return null
  }
  try {
    const data = await res.json()

    // 1) 평범한 객체에 inviteCode가 바로 있는 경우
    if (data && typeof data === "object" && "inviteCode" in data) {
      return data as ProjectDetailsResponse
    }

    // 2) { data: { inviteCode, ... } } 형태
    if (data && typeof data === "object" && "data" in data) {
      const inner = (data as { data?: unknown }).data
      if (inner && typeof inner === "object" && "inviteCode" in inner) {
        return inner as ProjectDetailsResponse
      }
    }

    // 3) { content: { inviteCode, ... } } 또는 { content: [ { inviteCode } ] }
    if (data && typeof data === "object" && "content" in data) {
      const content = (data as { content?: unknown }).content
      if (content && typeof content === "object" && !Array.isArray(content) && "inviteCode" in content) {
        return content as ProjectDetailsResponse
      }
      if (Array.isArray(content) && content.length > 0 && typeof content[0] === "object" && "inviteCode" in content[0]!) {
        return content[0] as ProjectDetailsResponse
      }
    }

    // 4) 기타 케이스: 전체 객체를 그대로 반환 (inviteCode가 없을 수도 있음)
    return data as ProjectDetailsResponse
  } catch {
    console.warn("[프로젝트 상세] JSON 파싱 실패")
    return null
  }
}

export interface CreateProjectRequest {
  name: string
  subject: string
}

export interface CreateProjectResponse {
  projectId: number
  name: string
  inviteCode: string
  status: string
  chatRoomId: number
  createdAt?: string
}

export async function createProject(
  data: CreateProjectRequest
): Promise<CreateProjectResponse> {
  const res = await apiRequest("/api/projects", {
    method: "POST",
    body: data,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`프로젝트 생성 실패: ${res.status} ${text}`)
  }

  return res.json()
}

export interface JoinProjectRequest {
  inviteCode: string
}

export interface JoinProjectResponse {
  projectId: number
  name?: string
  inviteCode?: string
  [key: string]: unknown
}

function parseProjectIdFromResponse(responseData: unknown): number | null {
  if (responseData && typeof responseData === "object" && "projectId" in responseData) {
    const v = (responseData as { projectId: unknown }).projectId
    if (typeof v === "number") return v
  }
  if (responseData && typeof responseData === "object" && "data" in responseData) {
    const data = (responseData as { data?: unknown }).data
    if (data && typeof data === "object" && "projectId" in data) {
      const v = (data as { projectId: unknown }).projectId
      if (typeof v === "number") return v
    }
  }
  if (typeof responseData === "number" && !isNaN(responseData)) return responseData
  if (responseData && typeof responseData === "object" && "id" in responseData) {
    const id = (responseData as { id?: unknown }).id
    if (typeof id === "number") return id
  }
  return null
}

export async function joinProject(
  data: JoinProjectRequest
): Promise<JoinProjectResponse> {
  const res = await apiRequest("/api/projects/join", {
    method: "POST",
    body: data,
  })

  let responseData: unknown
  try {
    const text = await res.text()
    responseData = text ? JSON.parse(text) : null
  } catch {
    responseData = null
  }

  const projectId = parseProjectIdFromResponse(responseData)
  if (projectId != null) {
    return {
      projectId,
      ...(responseData && typeof responseData === "object" ? (responseData as JoinProjectResponse) : {}),
    }
  }

  if (!res.ok) {
    const msg =
      responseData && typeof responseData === "object" && "message" in responseData
        ? String((responseData as { message: unknown }).message)
        : responseData && typeof responseData === "object" && "error" in responseData
          ? String((responseData as { error: unknown }).error)
          : `프로젝트 참여 실패: ${res.status}`
    throw new Error(msg)
  }

  throw new Error("참여는 완료되었습니다. 페이지를 새로고침해 주세요.")
}

/** 리더 전용. 서버에서 삭제되지 않으면 새로고침 시 목록에 다시 나타납니다. */
export async function deleteProject(projectId: number): Promise<void> {
  const res = await apiRequest(`/api/projects/${projectId}`, { method: "DELETE" })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`프로젝트 삭제 실패: ${res.status}${text ? ` ${text}` : ""}`)
  }
}

export interface ExportProjectRequest {
  projectId: number
  /** 백엔드 SummaryUpdateRequest와 동일한 필드 */
  summary: SummaryUpdateRequest
}

export async function exportProjectToNotion(
  data: ExportProjectRequest
): Promise<string> {
  const res = await apiRequest(`/api/projects/${data.projectId}/export`, {
    method: "POST",
    body: {
      projectId: data.projectId,
      summary: data.summary,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`노션 내보내기 실패: ${res.status} ${text}`)
  }

  const text = await res.text()
  return text
}
