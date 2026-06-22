# Colink.nz Security Plan

Colink.nz is a New Zealand Korean community platform with boards, auth,
marketplace, jobs, comments, messages, image uploads, business ads, and member
roles. Security is a product requirement, not a final checklist.

Colink.nz should use OWASP Top 10 and OWASP ASVS as the baseline for design,
development, testing, and launch review.

## Priority Risks

Colink.nz's highest-risk areas are:

- Member role and permission control
- Board spam and automated abuse
- Marketplace fraud and unsafe contact exposure
- Admin account takeover
- File upload abuse
- Personal data leakage

## 1. Authentication Security

- Use email verification for sign up.
- Prefer Amazon Cognito for managed authentication, MFA, and account recovery.
- Enforce a strong password policy.
- Never store plain-text passwords.
- If Colink.nz ever stores passwords directly, use Argon2id or bcrypt with a strong
  cost factor.
- Rate-limit login attempts by account, IP address, and device signal.
- Lock, challenge, or delay suspicious repeated failures.
- Require re-authentication for sensitive actions.
- Provide MFA for members and require MFA for admins.

## 2. Authorization and Access Control

- Separate `guest`, `member`, `verified_member`, `business_member`,
  `moderator`, `admin`, and `super_admin` roles.
- Validate every permission on the server, including API routes and admin
  actions.
- Check post, comment, profile, ad, and report ownership before mutation.
- Do not rely on hidden buttons or admin URLs as security.
- Keep admin permissions granular so one compromised admin account cannot
  control the whole platform.
- Record role changes in `admin_logs`.

## 3. Input Validation and Injection Defense

- Validate all post, comment, nickname, search, profile, report, ad, and upload
  fields.
- Use schema validation at API boundaries.
- Use prepared statements, an ORM, or a query builder to prevent SQL injection.
- Escape rendered user content by default.
- Sanitize any intentionally allowed rich text.
- Normalize and validate URLs before storing ad links or user-submitted links.
- Reject unexpected fields rather than silently accepting them.

## 4. Session, Cookie, and Token Security

- Use `HttpOnly`, `Secure`, and `SameSite` cookies where cookies are used.
- Keep access tokens short-lived.
- Protect refresh tokens from client-side JavaScript access.
- Invalidate sessions on logout, password reset, MFA changes, and account
  suspension.
- Apply idle timeout for admin sessions.
- Require re-authentication before role changes, account deletion, or sensitive
  admin actions.

## 5. File Upload and S3 Security

- Upload images through short-lived S3 pre-signed URLs.
- Scope each pre-signed URL to one object key and expected content type.
- Separate S3 prefixes for profile images, post images, and ad images.
- Validate extension, MIME type, file size, image dimensions, and object key
  format.
- Do not allow users to choose arbitrary S3 keys.
- Block executable file types and SVG uploads unless there is a strong reviewed
  reason.
- Serve uploaded assets from a controlled public-read or signed-read strategy.

## 6. Board and Community Abuse Prevention

- Rate-limit sign up, login, posting, comments, reports, uploads, and messages.
- Add Turnstile or reCAPTCHA for suspicious traffic and high-risk flows.
- Detect repeated posts, repeated comments, phishing links, and suspicious
  outbound URLs.
- Provide report and block flows for members.
- Give moderators tools to hide posts, remove comments, and review reports.
- Track repeat abuse by account, IP address, and device signal where legally and
  ethically appropriate.

## 7. Marketplace and Jobs Safety

- Keep phone numbers and email addresses private by default.
- Let users choose whether contact details are shown.
- Show safety guidance on marketplace posts.
- Automatically limit accounts with repeated fraud reports until reviewed.
- Require email verification before marketplace posting.
- Consider phone verification for higher trust features.
- Require business verification or admin approval for sensitive job posting
  flows.
- Log report outcomes so repeated patterns can be detected.

## 8. Privacy and Data Protection

- Collect the minimum personal data required for each feature.
- Avoid storing payment data or sensitive documents unless absolutely required.
- Encrypt sensitive fields when storage is unavoidable.
- Provide terms, privacy policy, account deletion, and personal data deletion
  paths.
- Keep contact details private unless the user explicitly chooses otherwise.
- Consider New Zealand Privacy Act expectations for collection, access,
  correction, retention, and disclosure.
- Define retention periods for logs, deleted content, and reports.

## 9. Server and Infrastructure Security

- Use HTTPS everywhere.
- Put CloudFront and AWS WAF in front of production traffic.
- Keep RDS inaccessible from the public internet.
- Apply least privilege to AWS IAM roles and database users.
- Store secrets in environment variables or AWS-managed secret storage.
- Never commit `.env.local`, API keys, database passwords, Cognito secrets, or
  S3 credentials.
- Use automated RDS backups.
- Separate production, staging, and local environment secrets.
- Log application errors and security events separately.

## 10. Admin Security

- Require MFA for all admins.
- Apply stricter login failure limits to admin accounts.
- Use a separate admin layout and server-side admin permission checks.
- Keep `super_admin` accounts to the minimum possible number.
- Record every admin mutation in `admin_logs`, including:
  - post deletion or hiding
  - comment deletion or hiding
  - user suspension or restoration
  - role changes
  - ad creation or editing
  - category changes
  - business verification decisions
  - site setting changes
- Consider IP allowlists or step-up authentication for the most sensitive admin
  actions.

## 11. Monitoring and Incident Response

- Detect abnormal login attempts.
- Detect bulk posting, bulk comments, repeated reports, and upload spikes.
- Temporarily restrict suspicious accounts automatically where appropriate.
- Notify admins about high-risk security events.
- Keep dependency updates on a regular schedule.
- Review audit logs after admin actions and abuse incidents.
- Prepare a simple incident response process before launch.

## Development Prompt

```text
Korin은 뉴질랜드 한인 커뮤니티 플랫폼이다.
게시판, 회원가입/로그인, 중고거래, 구인구직, 댓글, 쪽지, 이미지 업로드, 사업자 광고, 회원등급 시스템을 포함한다.

이 웹사이트는 보안을 최우선으로 설계해야 한다.
OWASP Top 10과 OWASP ASVS 기준을 기반으로 인증, 권한, 입력값 검증, 세션, 파일 업로드, 스팸 방지, 개인정보 보호, 관리자 보안을 반드시 반영하라.

모든 API는 서버 측에서 role과 ownership을 검증해야 한다.
게시글, 댓글, 닉네임, 검색어, 프로필, 광고 링크, 파일 업로드 입력값은 모두 검증해야 한다.
SQL Injection 방지를 위해 ORM, query builder, 또는 prepared statement를 사용한다.
XSS 방지를 위해 사용자 생성 콘텐츠는 escape 또는 sanitize한다.

이미지 업로드는 Amazon S3 pre-signed URL을 사용하며, 파일 크기, MIME 타입, 확장자, object key를 제한한다.
회원 권한은 guest, member, verified_member, business_member, moderator, admin, super_admin으로 나눈다.
관리자 계정은 MFA, 활동 로그, 권한 분리, 로그인 실패 제한을 적용한다.
모든 관리자 행동은 admin_logs 테이블에 기록한다.

Korin은 단순히 기능이 작동하는 수준이 아니라, 보안 중심의 커뮤니티 플랫폼 구조로 설계해야 한다.
특히 회원 권한 관리, 게시글 스팸 방지, 중고거래 사기 방지, 관리자 계정 보호를 가장 우선순위로 둔다.
```
