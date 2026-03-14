# Git 컨벤션

## 브랜치 네이밍

```
[feat/fix/bug/chore]/소문자이름/#이슈번호
```

### 예시
- `feat/google-login/#12` - 기능 추가
- `fix/api-cors/#8` - 수정
- `bug/login-error/#5` - 버그 수정
- `chore/setup-eslint/#3` - 설정/문서 등

---

## 커밋 메시지

```
[feat/fix/bug/chore] : 설명 (#이슈번호)
```

### 예시
- `feat: Google 로그인 연동 (#12)`
- `fix: API CORS 에러 수정 (#8)`
- `bug: 로그인 실패 시 무한 로딩 수정 (#5)`
- `chore: 이슈 템플릿 추가 (#3)`

---

## 타입 설명

| 타입 | 용도 |
|------|------|
| **feat** | 새로운 기능 |
| **fix** | 수정사항 |
| **bug** | 버그 수정 |
| **chore** | 세팅, 빌드, 문서, 인프라 등 기능 외 작업 |
