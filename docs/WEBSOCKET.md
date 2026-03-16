# WebSocket (STOMP) 채팅 연동

백엔드와 실시간 채팅 연동 시 사용하는 STOMP 경로입니다.

## 경로 (백엔드 전달)

| 용도 | 경로 |
|------|------|
| **구독 (Subscribe)** | `/sub/project/{projectId}` |
| **발신 (Publish)** | `/pub/chat/message` |

- 구독: 프로젝트별 채팅 메시지 수신
- 발신: 채팅 메시지 전송 (또는 컨트롤러 `@MessageMapping` 경로)

## 연결 URL

- 기본: `{API_BASE_URL}/ws-stomp` (예: `https://api.promate.ai.kr/ws-stomp`)
- 환경 변수: `NEXT_PUBLIC_WS_STOMP_URL` 로 오버라이드 가능

## 패키지

```bash
npm install @stomp/stompjs sockjs-client
```

## 참고

- `projectId`는 `backendProjectId` (프로젝트의 백엔드 ID)
- 인증 토큰은 연결 시 헤더 또는 쿼리 파라미터로 전달 필요할 수 있음
