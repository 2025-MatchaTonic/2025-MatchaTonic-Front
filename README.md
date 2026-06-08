# ProMate Frontend

> **기획은 줄이고, 실행은 앞당기세요.**  
> 소규모 학생 팀을 위한 AI 기반 프로젝트 시작 플랫폼

이화여자대학교 졸업 프로젝트 **말차토닉(MatchaTonic)** 팀의 프론트엔드 저장소입니다.

| 서비스 | URL |
|--------|-----|
| **프로덕션** | [https://promate.ai.kr](https://promate.ai.kr) |
| **Vercel (스테이징)** | [https://2025-matchatonic-front.vercel.app](https://2025-matchatonic-front.vercel.app) |
| **백엔드 API** | [https://api.promate.ai.kr](https://api.promate.ai.kr) |

---

## 소개

ProMate는 팀 프로젝트를 시작할 때 반복되는 기획·정리 작업을 AI가 대신해 주는 웹 서비스입니다.  
대화를 통해 프로젝트 요약을 자동으로 채우고, AI 템플릿 생성과 Notion 내보내기까지 한 흐름으로 이어집니다.

### 주요 기능

- **Google OAuth2 로그인** — 백엔드 세션 기반 인증
- **프로젝트 관리** — 생성, 초대 코드 참여, 팀원 조회, 리더 삭제
- **실시간 팀 채팅** — STOMP WebSocket (`/sub/project/{id}`, `/pub/chat/message`) + REST 폴백
- **AI 세션 요약** — 채팅 내용에서 제목·목표·역할·마감일·산출물 자동 추출
- **AI 프로젝트 템플릿** — 요약 기반 템플릿 생성
- **Notion 내보내기** — 프로젝트 요약을 Notion 페이지로 전송

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| UI | [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/) |
| Language | TypeScript |
| State | [Zustand](https://zustand-demo.pmnd.rs/) (persist) |
| Realtime | [@stomp/stompjs](https://stomp-js.github.io/), sockjs-client |
| Form / Validation | react-hook-form, zod |
| Deploy | Vercel |

---

## 시작하기

### 사전 요구사항

- Node.js 18+
- npm 또는 pnpm

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/2025-MatchaTonic/2025-MatchaTonic-Front.git
cd 2025-MatchaTonic-Front

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.local.example .env.local

# 개발 서버 실행 (포트 3001)
npm run dev
```

브라우저에서 [http://localhost:3001](http://localhost:3001) 으로 접속합니다.

### 환경 변수

| 변수 | 설명 | 예시 |
|------|------|------|
| `NEXT_PUBLIC_API_BASE_URL` | 백엔드 API 베이스 URL | `https://api.promate.ai.kr` |
| `NEXT_PUBLIC_WS_STOMP_URL` | WebSocket STOMP URL (선택) | `https://api.promate.ai.kr/ws-stomp` |

로컬 개발 시 백엔드 CORS에 `http://localhost:3001` 이 허용되어 있어야 합니다.

### 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 (포트 3001) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 |
| `npm run lint` | ESLint 실행 |

---

## 프로젝트 구조

```
├── app/                    # Next.js App Router 페이지
│   ├── oauth2/             # OAuth2 리다이렉트·콜백
│   └── notion-link/        # Notion 연동 딥링크
├── components/
│   ├── screens/            # 화면별 컴포넌트 (login, main, chat, export-notion)
│   └── ui/                 # shadcn/ui 공통 컴포넌트
├── lib/
│   ├── api/                # REST API 클라이언트
│   ├── websocket/          # STOMP 채팅 연동
│   ├── auth.ts             # JWT 토큰·세션 관리
│   └── store.ts            # Zustand 전역 상태
├── docs/                   # 백엔드 연동·Git 컨벤션 문서
└── public/                 # 정적 에셋 (로고, 폰트)
```

---

## 화면 흐름

```
로그인 → 메인(프로젝트 목록) → 채팅 → Notion 내보내기
         ↑ 프로젝트 생성/참여
```

- URL 해시(`/#main`, `/#chat` 등)로 화면 상태를 유지합니다.
- 로그인 세션은 JWT 토큰 + Zustand persist(`localStorage`)로 복원합니다.

---

## 관련 저장소

| 저장소 | 설명 |
|--------|------|
| [2025-MatchaTonic-Front](https://github.com/2025-MatchaTonic/2025-MatchaTonic-Front) | 프론트엔드 (현재 저장소) |
| [2025-MatchaTonic-Back](https://github.com/2025-MatchaTonic/2025-MatchaTonic-Back) | 백엔드 API |
| [2025-MatchaTonic-AI](https://github.com/2025-MatchaTonic/2025-MatchaTonic-AI) | AI 서비스 |

---

## 문서

- [백엔드 연동 가이드](./docs/BACKEND_INTEGRATION.md) — CORS, API 목록, 요청/응답 스펙
- [WebSocket 연동](./docs/WEBSOCKET.md) — STOMP 경로 및 설정
- [Git 컨벤션](./docs/GIT_CONVENTION.md) — 브랜치·커밋 규칙

---

## Git 컨벤션 (요약)

```
브랜치: [feat/fix/bug/chore]/소문자이름/#이슈번호
커밋:   [feat/fix/bug/chore]: 설명 (#이슈번호)
```

예: `feat/google-login/#12`, `fix: API CORS 에러 수정 (#8)`

자세한 내용은 [docs/GIT_CONVENTION.md](./docs/GIT_CONVENTION.md)를 참고하세요.

---

## 팀

**말차토닉 (MatchaTonic)** — 이화여자대학교 졸업 프로젝트

---

## 라이선스

본 프로젝트는 졸업 프로젝트용 비공개 저장소입니다. 별도 라이선스가 명시되지 않았습니다.
