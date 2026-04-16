import type { Message, SessionSummary } from "@/lib/store"
import { SESSION_SUMMARY_KEYS } from "@/lib/api/summary"

type SummaryKey = keyof SessionSummary

function cleanCapture(s: string): string {
  return s
    .replace(/^[\s"'「」『』【】[\]()]+|[\s"'「」『』【】[\]()]+$/g, "")
    .trim()
    .slice(0, 800)
}

function firstCapture(text: string, patterns: RegExp[]): string | undefined {
  for (const re of patterns) {
    const m = text.match(re)
    if (m?.[1]) {
      const v = cleanCapture(m[1])
      if (v) return v
    }
  }
  return undefined
}

function tryJsonBlock(text: string): Partial<SessionSummary> | null {
  const block = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (!block) return null
  try {
    const obj = JSON.parse(block[1].trim()) as Record<string, unknown>
    const pick = (keys: string[]): string | undefined => {
      for (const k of keys) {
        const v = obj[k]
        if (typeof v === "string" && v.trim()) return v.trim().slice(0, 800)
      }
      return undefined
    }
    const out: Partial<SessionSummary> = {}
    const t = pick(["title", "제목", "projectTitle"])
    const g = pick(["goal", "목표", "objective"])
    const ts = pick(["teamSize", "팀인원", "team_size", "인원"])
    const r = pick(["roles", "역할", "role"])
    const d = pick(["dueDate", "마감", "마감일", "due_date", "기한"])
    const del = pick(["deliverables", "산출물", "결과물"])
    if (t) out.title = t
    if (g) out.goal = g
    if (ts) out.teamSize = ts
    if (r) out.roles = r
    if (d) out.dueDate = d
    if (del) out.deliverables = del
    return Object.keys(out).length > 0 ? out : null
  } catch {
    return null
  }
}

/**
 * 채팅 전체 텍스트에서 세션 요약 후보를 추출합니다.
 * 빈 필드만 채우려면 mergeSessionSummaryFromExtract 와 함께 사용합니다.
 */
export function extractSessionSummaryFromMessages(
  messages: Message[],
  current: SessionSummary
): Partial<SessionSummary> {
  // 최신 대화를 우선 반영하기 위해 최근 메시지 역순으로 스캔한다.
  // (과거 문맥이 먼저 매칭되어 요약이 엉키는 문제 방지)
  const text = messages
    .slice(-40)
    .filter((m) => !m.text.includes("세션 요약이 모두 채워졌습니다."))
    .reverse()
    .map((m) => m.text)
    .join("\n")
  if (!text.trim()) return {}

  const fromJson = tryJsonBlock(text)
  const out: Partial<SessionSummary> = { ...(fromJson ?? {}) }

  const take = (key: SummaryKey, patterns: RegExp[]) => {
    if (current[key]?.trim() || out[key]?.trim()) return
    const v = firstCapture(text, patterns)
    if (v) out[key] = v
  }

  take("title", [
    /(?:^|\n)\s*(?:제목|프로젝트\s*제목|프로젝트명)\s*[:：\-]\s*([^\n]+)/i,
    /(?:^|\n)\s*[-*•]\s*(?:제목|프로젝트명)\s*[:：]\s*([^\n]+)/i,
  ])

  take("goal", [
    /(?:^|\n)\s*(?:목표|프로젝트\s*목표)\s*[:：\-]\s*([^\n]+)/i,
    /(?:^|\n)\s*[-*•]\s*목표\s*[:：]\s*([^\n]+)/i,
    /목표(?:는|은)\s+([^\n。\.]{2,200})/,
  ])

  take("teamSize", [
    /(?:^|\n)\s*(?:팀\s*인원|인원|팀원\s*수)\s*[:：\-]\s*([^\n]+)/i,
    /(?:^|\n)\s*[-*•]\s*(?:팀\s*인원|인원)\s*[:：]\s*([^\n]+)/i,
    /(\d+)\s*명(?:\s*정도)?(?:\s*참여|\s*구성)?/,
  ])

  take("roles", [
    /(?:^|\n)\s*(?:역할|팀\s*역할|담당)\s*[:：\-]\s*([^\n]+)/i,
    /(?:^|\n)\s*[-*•]\s*역할\s*[:：]\s*([^\n]+)/i,
  ])

  take("dueDate", [
    /(?:^|\n)\s*(?:마감(?:일)?|기한|데드라인|due)\s*[:：\-]\s*([^\n]+)/i,
    /(?:^|\n)\s*[-*•]\s*마감\s*[:：]\s*([^\n]+)/i,
    /(\d{4}[-./]\d{1,2}[-./]\d{1,2})/,
  ])

  take("deliverables", [
    /(?:^|\n)\s*(?:산출물|결과물|인도물)\s*[:：\-]\s*([^\n]+)/i,
    /(?:^|\n)\s*[-*•]\s*산출물\s*[:：]\s*([^\n]+)/i,
  ])

  // 남은 빈 필드: JSON 루트가 한 번에 온 경우 (블록 없이)
  if (!fromJson) {
    try {
      const trimmed = text.trim()
      if (trimmed.startsWith("{") && trimmed.includes('"title"')) {
        const obj = JSON.parse(trimmed) as Record<string, unknown>
        for (const k of SESSION_SUMMARY_KEYS) {
          if (current[k]?.trim() || out[k]?.trim()) continue
          const v = obj[k]
          if (typeof v === "string" && v.trim()) out[k] = v.trim().slice(0, 800)
        }
      }
    } catch {
      /* ignore */
    }
  }

  return out
}

export const SUMMARY_COMPLETE_PROMPT_MARKER =
  "세션 요약이 모두 채워졌습니다."
