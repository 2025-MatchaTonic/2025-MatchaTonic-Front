/**
 * 프로젝트 관련 API
 * - GET /api/projects/me: 내 프로젝트 목록 조회
 * - GET /api/projects/{projectId}/members: 팀원 목록 조회
 * - POST /api/projects: 새 프로젝트 생성
 * - POST /api/projects/join: 초대 코드로 참여
 * - POST /api/projects/{projectId}/export: AI 분석 및 노션 내보내기
 */

import { apiRequest } from "./request"

export interface MyProjectResponse {
  id: number
  name: string
  subject: string
  role: string
  status: string
  chatRoomId: number
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
  return Array.isArray(data) ? data : []
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

export async function joinProject(
  data: JoinProjectRequest
): Promise<JoinProjectResponse> {
  const res = await apiRequest("/api/projects/join", {
    method: "POST",
    body: data,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`프로젝트 참여 실패: ${res.status} ${text}`)
  }

  let responseData: unknown
  try {
    responseData = await res.json()
  } catch {
    responseData = null
  }
  if (responseData && typeof responseData === "object" && "projectId" in responseData) {
    return responseData as JoinProjectResponse
  }
  if (typeof responseData === "number" && !isNaN(responseData)) {
    return { projectId: responseData }
  }
  if (typeof responseData === "string") {
    const projectId = parseInt(responseData, 10)
    if (!isNaN(projectId)) return { projectId }
  }
  throw new Error("프로젝트 참여 응답 형식이 올바르지 않습니다.")
}

export interface ExportProjectRequest {
  projectId: number
  selectedAnswers: string[]
}

export async function exportProjectToNotion(
  data: ExportProjectRequest
): Promise<string> {
  const res = await apiRequest(`/api/projects/${data.projectId}/export`, {
    method: "POST",
    body: {
      projectId: data.projectId,
      selectedAnswers: data.selectedAnswers,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`노션 내보내기 실패: ${res.status} ${text}`)
  }

  const text = await res.text()
  return text
}
