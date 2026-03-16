# 백엔드 연동 가이드 (ProMate 프론트엔드)

프론트엔드와 백엔드 API 연동 시 필요한 정보입니다.

---

## 📋 간단 요약 (백엔드 전달용)

```
[CORS 허용 Origin]
- 로컬: http://localhost:3001
- 프로덕션: https://promate.ai.kr

[도메인]
- 프론트: https://promate.ai.kr
- API: https://api.promate.ai.kr

[스택] Next.js 16, React 19, TypeScript, Fetch API
[인증] credentials: "include" (쿠키)
```

---

## 1. CORS 설정 (필수)

백엔드에서 아래 Origin을 허용해 주세요.

| 환경 | Origin |
|------|--------|
| **로컬 개발** | `http://localhost:3001` |
| **프로덕션** | `https://promate.ai.kr` |

### 예시 (Express)
```javascript
const allowedOrigins = [
  'http://localhost:3001',
  'https://promate.ai.kr'
];
```

### 추가 CORS 헤더
- `Access-Control-Allow-Credentials: true` (세션 쿠키 전송용)
- `Access-Control-Allow-Headers: Content-Type`

---

## 2. 도메인

| 구분 | 주소 |
|------|------|
| **프론트엔드** | `https://promate.ai.kr` |
| **백엔드 API** | `https://api.promate.ai.kr` |

---

## 3. 프론트엔드 스택

| 항목 | 내용 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 런타임 | React 19 |
| 언어 | TypeScript |
| HTTP 클라이언트 | Fetch API (네이티브) |
| 인증 | `credentials: "include"` (쿠키 기반 세션) |

---

## 4. API 호출 방식

- **Content-Type**: `application/json`
- **Accept**: `application/json` 또는 `*/*`
- **인증**: 쿠키 기반 (`credentials: "include"`)
- **요청 방식**: REST (GET, POST)

---

## 5. 연동된 API 목록

### 사용자
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/users/me` | 로그인 유저 정보 조회 |
| GET | `/logout` | 로그아웃 (세션 정리 후 `post_logout_redirect_uri`로 리다이렉트 권장) |

### 프로젝트
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/projects/me` | 내 프로젝트 목록 조회 (inviteCode 포함 권장) |
| GET | `/api/projects/{projectId}` | 프로젝트 상세 조회 (inviteCode 포함) |
| GET | `/api/projects/{projectId}/members` | 팀원 목록 조회 |

### WebSocket (STOMP)
| 용도 | 경로 |
|------|------|
| 구독 | `/sub/project/{projectId}` |
| 발신 | `/pub/chat/message` |
| POST | `/api/projects` | 새 프로젝트 생성 |
| POST | `/api/projects/join` | 초대 코드로 참여 |
| POST | `/api/projects/{projectId}/export` | AI 분석 및 노션 내보내기 |

### 채팅
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/chat/{projectId}/messages` | 과거 채팅 내역 조회 |

### AI
| Method | Path | 설명 |
|--------|------|------|
| POST | `/ai/project/templates` | AI 프로젝트 템플릿 생성 |

---

## 6. API별 요청/응답 요약

### POST /api/projects (프로젝트 생성)
- **Request**: `{ name: string, subject: string }`
- **Response**: `{ projectId, name, inviteCode, status, chatRoomId }`

### POST /api/projects/join (참여)
- **Request**: `{ inviteCode: string }`
- **Response**: `{ projectId: number }` 또는 projectId 포함 객체

### GET /api/projects/me (내 프로젝트)
- **Response**: `[{ id, name, subject, role, status, chatRoomId, inviteCode? }]` (inviteCode 포함 권장)
- **role**: 프로젝트 생성자는 `"Leader"`, 참여자는 `"Member"` 등

### GET /api/projects/{projectId} (프로젝트 상세)
- **Response**: `{ id, name, subject, inviteCode?, ... }` (팀원목록 모달에서 초대 코드 표시용)

### GET /api/projects/{projectId}/members (팀원)
- **Response**: `[{ name, email, role }]`

### GET /api/chat/{projectId}/messages (채팅 내역)
- **Response**: `[{ type, projectId, senderEmail, senderName, message, createdAt }]`

### POST /api/projects/{projectId}/export (노션 내보내기)
- **Request**: `{ projectId: number, selectedAnswers: string[] }`
- **Response**: `string` (Notion URL 등)

### POST /ai/project/templates (AI 템플릿)
- **Request**: `{ projectId: number, selectedAnswers: string[] }`
- **Response**: `string`

---

## 7. 로컬 개발 서버

- **URL**: `http://localhost:3001`
- **실행**: `npm run dev`

---

## 8. 문의

프론트엔드 연동 관련 문의는 프론트엔드 담당자에게 연락해 주세요.
