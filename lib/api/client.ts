const DEFAULT_API_URL = "https://api.promate.ai.kr"

function getApiBaseUrlFromHost(): string {
  if (typeof window === "undefined") return ""
  const host = window.location.hostname
  if (host === "promate.ai.kr" || host.endsWith(".vercel.app")) {
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
