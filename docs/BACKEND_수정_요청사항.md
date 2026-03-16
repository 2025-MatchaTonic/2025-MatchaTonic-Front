# 백엔드 수정 요청 사항 (프론트엔드 이슈 대응)

프론트엔드에서 발생 중인 아래 이슈들을 해결하기 위해 백엔드에서 수정이 필요한 부분을 정리했습니다.

---

## 1. 팀원 목록이 안 보임

### 원인 추정
- `GET /api/projects/{projectId}/members` 응답이 비어있거나 실패
- 또는 해당 API가 JWT/세션 검증 후 멤버 목록을 반환하지 않음

### 백엔드 수정 요청
- **`GET /api/projects/{projectId}/members`** 가 해당 프로젝트의 **모든 멤버**를 반환하는지 확인
- 응답 형식: `[{ name: string, email: string, role: string }]`
- 프로젝트에 참여한 모든 사용자(생성자 + 초대 참여자)가 포함되어야 함

---

## 2. 역할 부여 안 됨

### 원인 추정
- `/api/projects/{projectId}/members` 응답에서 모든 멤버의 `role`이 `"Member"`로만 내려옴

### 백엔드 수정 요청
- **프로젝트 생성자**: `role: "Leader"`
- **초대로 참여한 멤버**: `role: "Member"` (또는 Designer, Developer, Researcher 등 지정된 역할)
- `/api/projects/me` 응답의 `role`과 `/api/projects/{projectId}/members` 각 항목의 `role`이 일치해야 함

---

## 3. 기존 채팅이 없어짐

### 원인 추정
- `GET /api/chat/{projectId}/messages`가 빈 배열을 반환
- WebSocket/REST로 전송된 메시지가 DB에 저장되지 않음
- 또는 저장은 되지만 조회 API가 해당 데이터를 반환하지 않음

### 백엔드 수정 요청
- **채팅 메시지 DB 저장**: WebSocket `/pub/chat/message` 수신 시, REST `POST /api/chat/{projectId}/messages` 수신 시 모두 DB에 저장
- **`GET /api/chat/{projectId}/messages`**: 해당 프로젝트의 **전체 채팅 내역**을 시간순으로 반환
- 응답 형식: `[{ type, projectId, senderEmail, senderName, message, createdAt }]`

---

## 4. 채팅 한 번 보낼 때 두 번 보임

### 원인 추정
- WebSocket으로 메시지 전송 시, 백엔드가 `/sub/project/{projectId}`로 브로드캐스트
- 브로드캐스트 페이로드에 **`senderEmail`** 이 없으면, 프론트엔드에서 “내가 보낸 메시지”인지 구분 불가
- 결과적으로 로컬에 추가한 메시지 + WebSocket으로 받은 메시지가 둘 다 표시되어 중복

### 백엔드 수정 요청
- WebSocket 메시지 브로드캐스트 시 페이로드에 **반드시** 다음 필드 포함:
  ```json
  {
    "projectId": 123,
    "senderEmail": "user@example.com",
    "senderName": "홍길동",
    "message": "채팅 내용",
    "type": "CHAT",
    "createdAt": "2025-03-16T12:00:00"
  }
  ```
- `senderEmail`, `senderName`이 없으면 프론트엔드에서 중복 제거 및 발신자 구분 불가

---

## 요약 체크리스트

| # | API/기능 | 수정 내용 |
|---|----------|-----------|
| 1 | `GET /api/projects/{projectId}/members` | 프로젝트 멤버 전체 반환, 빈 배열이면 안 됨 |
| 2 | `GET /api/projects/{projectId}/members` | 생성자 `role: "Leader"`, 나머지는 적절한 역할 부여 |
| 3 | WebSocket + REST | 채팅 메시지 DB 저장 |
| 3 | `GET /api/chat/{projectId}/messages` | 저장된 채팅 내역 전체 반환 |
| 4 | WebSocket 브로드캐스트 | `senderEmail`, `senderName` 필수 포함 |

---

## 추가 참고

- **초대 코드**: `GET /api/projects/{projectId}` 응답에 `inviteCode` 포함 (초대된 멤버도 조회 가능해야 함)
- **POST /api/chat/{projectId}/messages**: WebSocket 미동작 시 REST로 전송되는 메시지도 동일하게 DB 저장 필요
