const DEFAULT_API_URL = "https://api.promate.ai.kr"

function getApiBaseUrlFromHost(): string {
  if (typeof window === "undefined") return ""
  const host = window.location.hostname
  // promate.ai.kr, www.promate.ai.kr, localhost(개발), vercel 배포
  if (
    host === "promate.ai.kr" ||
    host.endsWith(".promate.ai.kr") ||
    host.endsWith(".vercel.app") ||
    host === "localhost"
  ) {
    return DEFAULT_API_URL
  }
  return ""
}

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return (
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      getApiBaseUrlFromHost() ||
      ""
    )
  }
  return process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || ""
}

export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl().replace(/\/$/, "")
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${base}${normalizedPath}`
}
