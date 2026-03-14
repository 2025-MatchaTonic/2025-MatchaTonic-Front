export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_BASE_URL || ""
  }
  return process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || ""
}

export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl().replace(/\/$/, "")
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${base}${normalizedPath}`
}
