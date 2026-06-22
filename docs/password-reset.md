# Colink.nz Password Reset Flow

Colink.nz 비밀번호 찾기는 가입 이메일을 기준으로 처리한다. 사용자는 로그인 화면의
`비밀번호 찾기`에서 가입 이메일을 입력하고, 메일로 받은 버튼을 눌러 현재
사이트의 새 비밀번호 설정 화면으로 돌아온다.

## User Flow

```text
로그인 화면
→ 비밀번호 찾기
→ 가입 이메일 입력
→ 비밀번호 재설정 메일 발송
→ 메일의 "비밀번호 재설정하기" 버튼 클릭
→ /auth/reset-password?token=...
→ 새 비밀번호 + 재확인 입력
→ 새 비밀번호로 로그인
```

## Security Rules

```text
- 가입 이메일로만 비밀번호 재설정 메일을 보낸다.
- 계정 존재 여부가 노출되지 않도록 성공 응답 문구는 동일하게 유지한다.
- 재설정 토큰은 원문 저장 금지, SHA-256 hash만 저장한다.
- 재설정 링크는 30분 후 만료된다.
- 토큰은 한 번 사용하면 consumed 처리하여 재사용할 수 없다.
- 새 비밀번호는 회원가입과 동일한 강력한 비밀번호 정책을 사용한다.
```

## Data Model

```text
password_resets
- id
- user_id
- email
- token_hash
- expires_at
- consumed_at
- created_at
```

현재 MVP 로컬 개발 환경에서는 `data/password-resets.json`에 같은 구조의 데이터를
저장한다. 운영 DB에서는 `database/schema.sql`의 `password_resets` 테이블을 사용한다.

## Email Template

비밀번호 재설정 메일은 HTML 카드형 템플릿으로 발송한다.

```text
제목: [Colink.nz] 비밀번호 재설정
버튼: 비밀번호 재설정하기
유효 시간: 30분
```

HTML 메일을 표시하지 못하는 메일 앱을 위해 텍스트 버전에도 재설정 URL을 포함한다.
