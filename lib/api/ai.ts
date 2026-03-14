/**
 * AI 관련 API
 * - POST /ai/project/templates: AI 프로젝트 템플릿 생성
 */

import { buildApiUrl } from "./client"

export interface GenerateTemplatesRequest {
  projectId: number
  selectedAnswers: string[]
}

export async function generateProjectTemplates(
  data: GenerateTemplatesRequest
): Promise<string> {
  const url = buildApiUrl("/ai/project/templates")
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`템플릿 생성 실패: ${res.status} ${text}`)
  }

  const text = await res.text()
  return text
}
