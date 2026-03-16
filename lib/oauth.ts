/**
 * OAuth 로그인 URL
 */

const OAUTH_BASE = "https://api.promate.ai.kr/oauth2/authorization/google"

export function getOAuthLoginUrl(): string {
  return OAUTH_BASE
}
