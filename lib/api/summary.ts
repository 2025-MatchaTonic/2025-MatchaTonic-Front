/**
 * 백엔드 SummaryUpdateRequest DTO와 동일한 필드명으로 요약을 전송합니다.
 * (기존 selectedAnswers: string[] 또는 sessionSummary 단일 필드 대신 사용)
 */
import type { SessionSummary } from "@/lib/store"

export const SESSION_SUMMARY_KEYS: (keyof SessionSummary)[] = [
  "title",
  "goal",
  "teamSize",
  "roles",
  "dueDate",
  "deliverables",
]

function summaryFieldString(v: unknown): string {
  if (v == null) return ""
  if (typeof v === "string") return v
  if (v instanceof Date) return v.toISOString()
  return String(v)
}

export function isSessionSummaryComplete(
  s: SessionSummary | null | undefined
): boolean {
  if (!s) return false
  return SESSION_SUMMARY_KEYS.every(
    (k) => summaryFieldString(s[k]).trim().length > 0
  )
}

export function sessionSummaryEqual(a: SessionSummary, b: SessionSummary): boolean {
  return SESSION_SUMMARY_KEYS.every(
    (k) =>
      summaryFieldString(a[k]).trim() === summaryFieldString(b[k]).trim()
  )
}

/** 비어 있는 필드만 extracted 값으로 채움 (수동 입력 유지) */
export function mergeSessionSummaryFromExtract(
  current: SessionSummary,
  extracted: Partial<SessionSummary>
): SessionSummary {
  const next = { ...current }
  for (const k of SESSION_SUMMARY_KEYS) {
    const ex = extracted[k]
    if (
      !summaryFieldString(current[k]).trim() &&
      typeof ex === "string" &&
      ex.trim().length > 0
    ) {
      next[k] = ex.trim()
    }
  }
  return next
}

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
  return [
    s.title,
    s.goal,
    s.teamSize,
    s.roles,
    s.dueDate,
    s.deliverables,
  ].some((v) => summaryFieldString(v).trim().length > 0)
}
