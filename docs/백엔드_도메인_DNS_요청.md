# 백엔드 전달: 도메인 DNS 설정 요청

백엔드에게 전달할 메시지입니다.  
(도메인 구매: 가비아 / DNS 관리: AWS Route 53)

---

## 메시지 본문

```
안녕하세요, 프론트엔드 담당자입니다.

프론트엔드가 Vercel에 배포되어 있고, 
promate.ai.kr 도메인을 프론트에 연결하려고 합니다.

DNS가 AWS에서 관리된다고 해서, 
Route 53에서 아래처럼 설정해 주시면 감사하겠습니다.

---

[AWS Route 53 DNS 설정 요청]

1. AWS 콘솔 → Route 53 → 호스팅 영역
2. promate.ai.kr (또는 ai.kr) 호스팅 영역 선택
3. 레코드 생성

   - 레코드 이름: promate (또는 루트면 비움)
   - 레코드 유형: A
   - 값: 76.76.21.21
   - TTL: 300 (또는 기본값)

4. 저장 후 10분~24시간 정도 DNS 전파 대기

---

이렇게 설정하면 promate.ai.kr 접속 시 
Vercel에 배포된 프론트엔드 화면이 보이게 됩니다.

추가로, CORS와 Google OAuth 설정을 위해 
아래 Vercel 앱 주소도 함께 등록해 주시면 감사합니다.

- https://2025-matchatonic-front.vercel.app

감사합니다.
```

---

## Vercel 주소를 백엔드에 전달해야 하는 이유

| 용도 | 설명 |
|------|------|
| **CORS** | API 요청 시 이 Origin을 허용해야 함 |
| **Google OAuth** | 로그인 후 사용자를 이 주소로 리다이렉트 |

`promate.ai.kr` DNS가 아직 연결되지 않았을 때도  
`https://2025-matchatonic-front.vercel.app`로 접속 가능하므로  
백엔드 설정에 두 주소 모두 포함하는 것이 좋습니다.
