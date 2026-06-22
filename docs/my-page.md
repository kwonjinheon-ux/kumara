# Colink.nz My Page

Korin의 로그인 후 사용자 메뉴 이름은 `내 계정보기`가 아니라 `내 페이지`로 사용한다.
`/my-page`는 사용자가 자신의 프로필, 게시글, 댓글, 찜, 채팅, 보안, 회원등급을
관리하는 계정 허브다.

현재 MVP 개발 환경에서는 PostgreSQL 연결 전 단계로 `data/users.json`과
`data/keyword-alerts.json`을 로컬 DB처럼 사용한다. API 계약은 RDS PostgreSQL로
옮기기 쉽도록 REST 구조로 먼저 고정한다.

## Route

```text
/my-page
```

로그인하지 않은 사용자는 `/auth/login`으로 이동한다.

## Menu

```text
내 페이지
- 프로필 설정
- 내가 쓴 게시글 관리
- 내가 쓴 댓글 관리
- 내가 찜한 글
- 1:1 채팅방
- 키워드 알람 설정
- 비밀번호 및 보안
- 회원등급 / 포인트
```

## Profile Settings

프로필 설정에서는 회원가입 때 입력하지 않은 정보를 나중에 추가하거나 수정한다.

```text
- 프로필 사진
- 닉네임
- 자기소개
- 사는 지역
- 세부 지역
- 카카오톡 ID
- 전화번호
- 연락처 공개 여부
- Colink.nz 1:1 채팅 허용 여부
- 알림 설정
```

사는 지역은 자유 입력이 아니라 드롭다운으로 관리한다. MVP 기본값은 뉴질랜드 한인
생활권을 기준으로 `Auckland Central`, `North Shore`, `West Auckland`,
`East Auckland`, `South Auckland`, `Hamilton`, `Tauranga`, `Wellington`,
`Lower Hutt`, `Christchurch`, `Dunedin`, `Palmerston North` 12개 지역과
`대한민국`, `기타 지역`을 제공한다.

세부 지역은 사는 지역 선택값에 따라 대표 suburb 드롭다운을 바꿔 보여준다. 예를 들어
`Hamilton`은 `Rototuna`, `Flagstaff`, `Chartwell`, `Hillcrest`,
`Hamilton East`, `Dinsdale`, `Frankton`, `Claudelands`를 제공하고,
`North Shore`는 `Takapuna`, `Devonport`, `Northcote`, `Glenfield`,
`Birkenhead`, `Albany`, `Rosedale`, `Browns Bay`를 제공한다. 운영 단계에서는
사용자 수와 게시글 분포를 보면서 지역 목록을 계속 조정한다.

프로필 이미지는 원형으로 표시하며, 사용자는 이미지 확대/축소와 위치 조정을 할 수
있다. 저장 시 운영 환경에서는 정사각형 crop 이미지를 S3에 저장하고 프로필 이미지로
사용한다. 현재 MVP 화면은 업로드 미리보기와 조정 UI를 먼저 제공한다.

프로필 저장은 다음 API를 사용한다.

```text
PUT /api/my-page/profile
```

저장 대상은 닉네임, 프로필 이미지, 사는 지역, 세부 지역, 카카오톡 ID, 전화번호,
자기소개, 연락처 공개 여부, 채팅 허용 여부, 알림 설정이다.

## Posts, Comments, Favorites

내가 쓴 게시글, 내가 쓴 댓글, 내가 찜한 글은 카테고리 필터, 검색, 전체 선택,
부분 선택, 선택 삭제 기능을 기준으로 설계한다. 중고거래 게시글은 목록에서
`판매중`, `예약중`, `판매완료` 상태를 바로 변경할 수 있게 확장한다.

## Chat

1:1 채팅방은 게시글 기반으로 생성한다. 채팅 목록에는 상대 프로필, 관련 게시글,
마지막 메시지, 시간, 읽지 않은 메시지 수를 표시한다. 본인 게시글에서는 채팅하기
버튼을 숨기고 내 글 관리 버튼을 표시한다.

현재 채팅 기능은 다음 흐름을 기준으로 한다.

```text
채팅방 목록
→ 선택한 채팅방
→ 메시지 목록
→ 메시지 입력
```

데스크톱과 모바일은 같은 정보 구조를 사용한다. 모바일에서 채팅방 아래에 아코디언처럼
채팅창을 반복 생성하지 않는다. 이 방식은 레이아웃 재계산이 많아지고 스크롤 지연이
생기기 때문이다.

모바일 최적화 기준:

```text
- 채팅방 목록과 선택된 채팅 패널을 같은 작업공간 안에 배치한다.
- 채팅방 목록은 자체 스크롤 영역을 가진다.
- 메시지 목록만 독립적으로 스크롤된다.
- 새 메시지를 보내도 전체 페이지 레이아웃이 밀리지 않는다.
- 메시지 전송은 optimistic UI로 즉시 표시한다.
- 읽음 처리, 미읽음 배지, 나가기 동작은 API 저장과 UI 반응을 분리한다.
```

채팅 저장은 현재 MVP에서 로컬 JSON 저장소를 사용하고, 운영 단계에서는 다음 구조로
PostgreSQL에 이전한다.

```text
GET /api/my-page/chats
POST /api/my-page/chats
POST /api/my-page/chats/:chatId/messages
PATCH /api/my-page/chats/:chatId/read
DELETE /api/my-page/chats/:chatId
```

## Keyword Alerts

키워드 알람 설정은 사용자가 관심 있는 단어를 등록하고, 해당 키워드가 포함된 새
게시물이 올라왔을 때 알림을 받는 기능이다.

```text
- 입력 후 Enter로 즉시 등록
- 빈 값 등록 불가
- 2글자 미만 등록 불가
- 중복 키워드 등록 불가
- 개별 키워드 삭제 가능
- 전체 삭제 가능
```

등급별 등록 가능 키워드 수는 다음을 기본값으로 한다.

```text
Iron: 5
Silver: 8
Gold: 12
Platinum: 20
Diamond: 30
Master: 50
Grandmaster: 80
Challenger: 100
```

초기 알림 범위 기본값은 `중고거래`, `부동산`, `구인구직`이다. 알림 방식은 사이트
내부 알림을 기본 ON으로 두고, 이메일 알림은 사용자가 선택할 수 있게 한다. 앱 푸시
알림은 모바일 앱 출시 후 연결할 수 있도록 UI와 DB 필드를 미리 둔다.

새 게시글 등록 시 제목과 본문을 기준으로 활성 키워드 알람을 검색하고, 일치하면
`notifications` 레코드를 생성한다. 이메일 알림이 켜진 경우에는 같은 이벤트에서
이메일 발송 작업을 큐에 넣는다.

키워드 알람 저장은 다음 API를 사용한다.

```text
GET /api/my-page/keyword-alerts
PUT /api/my-page/keyword-alerts
```

키워드 알람 등급표는 키워드 알람 탭이 아니라 `회원등급 / 포인트` 탭에서 함께
확인하도록 유지한다. 키워드 알람 탭은 현재 등급, 현재 등록 수, 입력/삭제/알림 방식
설정에 집중한다.

## Notifications

상단 네비게이션 알림 아이콘은 사용자의 읽지 않은 알림 총 개수를 배지로 표시한다.
알림 페이지는 찜, 댓글, 채팅, 키워드 알림 등을 한 곳에서 모아 보여주는 관리 화면이다.

알림 관리 기준:

```text
- 전체 알림 목록 보기
- 읽음 / 안 읽음 상태 표시
- 알림 수정 또는 상태 변경
- 개별 삭제
- 전체 삭제
- 확인된 알림은 7일 뒤 자동 삭제
```

알림은 사용자가 화면을 이동하지 않아도 빠르게 확인할 수 있어야 하며, 모바일 앱 출시 후
푸시 알림으로 확장 가능한 구조를 유지한다.

## Security

비밀번호 및 보안 탭은 다음 기능을 포함한다.

```text
- 비밀번호 재설정
- 이메일 인증 상태
- 2단계 인증
- 모든 기기에서 로그아웃
```

## Database Additions

```text
user_profiles
- city
- suburb
- show_kakao_talk_id
- show_phone_number
- allow_chat

favorites
- id
- user_id
- target_type
- target_id
- created_at

chats
- id
- post_id
- buyer_id
- seller_id
- is_buyer_blocked
- is_seller_blocked
- created_at
- updated_at

chat_messages
- id
- chat_id
- sender_id
- message
- is_read
- created_at

keyword_alerts
- id
- user_id
- keyword
- category_scope
- notify_in_app
- notify_email
- notify_push
- is_active
- created_at

notifications
- id
- user_id
- type
- title
- message
- target_type
- target_id
- is_read
- created_at
```

## Design Direction

```text
- 연한 회색/푸른 배경
- 흰색 카드형 레이아웃
- 8px 기준 둥근 모서리
- 부드러운 그림자
- 왼쪽 사이드 메뉴 + 오른쪽 콘텐츠
- 모바일에서는 화면 폭에 맞는 단일 컬럼과 독립 스크롤 영역
- 명확한 입력창과 버튼 hover 애니메이션
```

프로필, 게시글, 댓글, 북마크, 채팅, 보안, 회원등급 탭의 본문 영역은 과한 bold를
피하고 normal 또는 중간 굵기의 font weight를 사용한다. 왼쪽 메뉴도 같은 기준으로
정리해 시각적 부담을 줄인다.
