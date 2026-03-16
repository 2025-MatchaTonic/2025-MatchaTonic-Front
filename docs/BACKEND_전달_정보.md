# 백엔드 전달 정보 (ProMate 프론트엔드)

프론트엔드 담당자가 백엔드에 전달할 정보를 정리했습니다.

---

## 1. CORS 허용 Origin (필수)

백엔드에서 아래 Origin을 **모두** 허용해 주세요.

| 환경 | Origin |
|------|--------|
| 로컬 개발 | `http://localhost:3001` |
| Vercel 배포 | `https://2025-matchatonic-front.vercel.app` |
| 프로덕션 (커스텀 도메인) | `https://promate.ai.kr` |

### 추가 CORS 헤더
- `Access-Control-Allow-Credentials: true` (세션 쿠키 전송용)
- `Access-Control-Allow-Headers: Content-Type, Authorization` (Bearer 토큰용)

---

## 2. 도메인 (백엔드 전달 필수)

아래 주소들은 **CORS**, **Google OAuth 리다이렉트** 설정에 필요합니다.

| 구분 | 주소 | 용도 |
|------|------|------|
| 프론트엔드 (Vercel) | `https://2025-matchatonic-front.vercel.app` | CORS, OAuth 콜백 리다이렉트 |
| 프론트엔드 (커스텀) | `https://promate.ai.kr` | CORS, OAuth 콜백 리다이렉트 |
| 백엔드 API | `https://api.promate.ai.kr` | - |

---

## 3. 프론트엔드 배포 현황

- **플랫폼**: Vercel
- **상태**: 배포 완료
- **Vercel 앱 주소**: `https://2025-matchatonic-front.vercel.app` ← 백엔드에 전달 필요
- **커스텀 도메인**: `promate.ai.kr` (DNS 설정 진행 중)

---

## 4. Google OAuth 연동 요청

프론트엔드에서 Google 로그인 버튼 클릭 시 **백엔드 OAuth URL로 리다이렉트**할 예정입니다.

### 백엔드에 필요한 엔드포인트
- `GET /api/auth/google` - Google 로그인 시작 (리다이렉트)
- `GET /api/auth/google/callback` - Google 콜백 처리, 세션 생성

### 콜백 후 리다이렉트 주소
- 로컬: `http://localhost:3001`
- 프로덕션: `https://promate.ai.kr` 또는 `https://2025-matchatonic-front.vercel.app`

### Google Cloud Console 설정
- **Authorized redirect URIs**에 `https://api.promate.ai.kr/api/auth/google/callback` 등록 필요

---

## 5. API 연동 현황

프론트엔드에서 아래 API를 호출하도록 구현되어 있습니다.

| Method | Path | 용도 |
|--------|------|------|
| GET | `/api/users/me` | 로그인 유저 정보 |
| GET | `/api/projects/me` | 내 프로젝트 목록 |
| GET | `/api/projects/{projectId}` | 프로젝트 상세 (초대 코드 등) |
| GET | `/api/projects/{projectId}/members` | 팀원 목록 |
| POST | `/api/projects` | 프로젝트 생성 |
| POST | `/api/projects/join` | 초대 코드로 참여 |
| POST | `/api/projects/{projectId}/export` | 노션 내보내기 |
| GET | `/api/chat/{projectId}/messages` | 채팅 내역 |
| POST | `/ai/project/templates` | AI 템플릿 생성 |

- **인증**: `credentials: "include"` (쿠키)
- **Content-Type**: `application/json`

---

## 6. 확인 요청 사항

1. **CORS**: 위 Origin 3개 모두 허용되었는지 확인
2. **API 동작**: `https://api.promate.ai.kr` 정상 응답 여부
3. **Google OAuth**: `/api/auth/google`, `/api/auth/google/callback` 구현 여부
4. **EC2**: API 서버 정상 동작 여부 (필요 시)

---

## 7. 참고 문서

- 상세 API 스펙: `docs/BACKEND_INTEGRATION.md`
