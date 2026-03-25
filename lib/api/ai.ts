/**
 * AI 관련 API
 * - POST /ai/project/templates: AI 프로젝트 템플릿 생성
 * - 요약은 SummaryUpdateRequest(summary: { title, goal, ... }) 형태로 전송
 */

import { apiRequest } from "./request"
import type { SummaryUpdateRequest } from "./summary"

export interface GenerateTemplatesRequest {
  projectId: number
  /** 백엔드 SummaryUpdateRequest와 동일한 필드 */
  summary: SummaryUpdateRequest
}

export async function generateProjectTemplates(
  data: GenerateTemplatesRequest
): Promise<string> {
  const res = await apiRequest("/ai/project/templates", {
    method: "POST",
    body: {
      projectId: data.projectId,
      summary: data.summary,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`템플릿 생성 실패: ${res.status} ${text}`)
  }

  const text = await res.text()
  return text
}
