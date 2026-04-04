/** 백엔드 role 문자열을 UI·권한 판별용으로 정규화 */
export function normalizeProjectRole(r: string | undefined | null): string {
  const s = (r ?? "").trim();
  if (!s) return "Member";
  const key = s.toLowerCase();
  if (
    key === "leader" ||
    key === "owner" ||
    key === "creator" ||
    key === "admin"
  ) {
    return "Leader";
  }
  if (key === "member") return "Member";
  if (key === "designer") return "Designer";
  if (key === "developer") return "Developer";
  if (key === "researcher") return "Researcher";
  return "Member";
}

export function isProjectLeaderRole(r: string | undefined | null): boolean {
  return normalizeProjectRole(r) === "Leader";
}
