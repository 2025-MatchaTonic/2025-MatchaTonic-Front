/**
 * AI 템플릿 생성 — POST /api/projects/{projectId}/analyze
 */

import {
  analyzeProject,
  mapFrontendTemplateTypes,
  type ProjectExportRequest,
} from "./projects"

export interface GenerateTemplatesRequest {
  projectId: number
  templateTypes?: string[]
  content?: string
  selectedAnswers?: string[]
}

export async function generateProjectTemplates(
  data: GenerateTemplatesRequest
): Promise<string> {
  const payload: ProjectExportRequest = {
    projectId: data.projectId,
    templateType: mapFrontendTemplateTypes(data.templateTypes ?? []),
    content: data.content ?? "템플릿 생성 요청",
    selectedAnswers: data.selectedAnswers,
  }
  return analyzeProject(payload)
}
