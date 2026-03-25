/**
 * 백엔드 SummaryUpdateRequest DTO와 동일한 필드명으로 요약을 전송합니다.
 * (기존 selectedAnswers: string[] 또는 sessionSummary 단일 필드 대신 사용)
 */
import type { SessionSummary } from "@/lib/store"

export interface SummaryUpdateRequest {
  title?: string
  goal?: string
  teamSize?: string
  roles?: string
  dueDate?: string
  deliverables?: string
}

/** 세션 요약 → API 요청 객체 (빈 문자열은 그대로 전달, 백엔드 DTO 매핑용) */
export function sessionSummaryToUpdateRequest(s: SessionSummary): SummaryUpdateRequest {
  return {
    title: s.title ?? "",
    goal: s.goal ?? "",
    teamSize: s.teamSize ?? "",
    roles: s.roles ?? "",
    dueDate: s.dueDate ?? "",
    deliverables: s.deliverables ?? "",
  }
}

export function hasSummaryContent(s: SessionSummary | null | undefined): boolean {
  if (!s) return false
  return [s.title, s.goal, s.teamSize, s.roles, s.dueDate, s.deliverables].some(
    (v) => typeof v === "string" && v.trim().length > 0
  )
}
