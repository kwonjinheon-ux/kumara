# Colink.nz Sign Up Strategy

Colink.nz sign up should be fast. The first form should collect only what is needed
to create an account safely. Extra profile details should be collected later in
My Page as optional steps that unlock more trust and functionality.

## Quick Sign Up Form

| Field | Required | Purpose |
| --- | ---: | --- |
| Email | Required | Login ID and spam prevention |
| Password | Required | Minimum 8 characters recommended |
| Nickname | Required | Community display name |
| Terms agreement | Required | Terms and privacy policy |
| Age 14+ confirmation | Required | Community safety baseline |

Recommended copy:

```text
회원가입

이메일 *
비밀번호 *
닉네임 *

[ ] 이용약관 및 개인정보 처리방침에 동의합니다. *
[ ] 만 14세 이상입니다. *

가입하기
```

## Optional Profile After Sign Up

| Field | Required | Used For |
| --- | ---: | --- |
| Email verification | Required when signing up with email | Spam prevention, verified email badge |
| Profile image | Optional | Trust building |
| Smartphone number | Optional | Trade contact and trust |
| KakaoTalk ID | Optional | Trade contact |
| Bio | Optional | Community trust |
| Interest categories | Optional | Personalized recommendations |
| Preferred language | Optional | Korean / English |
| Notification settings | Optional | Comments, saved posts, trade messages |
| Trade area | Optional | Marketplace filters |
| Referral ID | Optional | Referral tracking and community growth |
| Business status | Optional | Business listing and ads |
| Business details | Optional | Jobs and business verification |
| Phone verification | Optional | Trust badge and trade features |
| Residency status | Optional | Student, working holiday, resident, citizen |
| Car ownership | Optional | Car board and calculator features |
| Life-info interests | Optional | Visa, rent, insurance, school, hospital |

## Feature Unlocks

```text
기본회원
- 글 읽기
- 댓글 작성
- 자유게시판 글쓰기

이메일 인증회원
- 중고거래 글쓰기
- 찜 기능
- 쪽지 기능

휴대폰 인증회원
- 거래 신뢰 배지
- 구인구직 지원
- 거래글 상단 노출

사업자 인증회원
- 구인공고 등록
- 업체 홍보
- 광고 신청
- 비즈니스 프로필 운영
```

## Development Prompt

```text
Colink.nz 회원가입은 최대한 빠르게 완료되도록 설계한다.

초기 회원가입 필수 항목은 이메일, 이메일 인증, 비밀번호, 닉네임, 약관 동의, 만 14세 이상 확인으로 제한한다.

가입은 이메일로만 가능하며 스팸 방지를 위해 이메일 인증을 필수로 적용한다. 스마트폰 번호, 카카오톡 ID, 프로필 이미지, 자기소개, 관심 카테고리, 알림 설정, 거래 가능 지역, 추천인 ID, 사업자 여부, 휴대폰 인증, 거주 상태 등은 선택 입력 항목으로 제공한다. 이메일 인증을 완료한 계정은 아이디 옆에 인증 표시를 보여준다.

회원정보를 더 많이 입력할수록 추가 기능이 열리도록 설계한다. 예를 들어 이메일 인증을 완료하면 중고거래 글쓰기와 찜 기능을 사용할 수 있고, 휴대폰 인증을 완료하면 신뢰 배지와 거래 기능이 확장된다. 사업자 인증을 완료하면 구인공고와 업체 홍보 기능을 사용할 수 있다.

가입 단계에서는 사용자의 이탈을 줄이는 것을 최우선으로 하며, 상세 정보는 마이페이지에서 단계적으로 입력하도록 한다.
```
