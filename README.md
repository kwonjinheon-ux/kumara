# Colink.nz

Colink.nz is a Korean community platform for New Zealand. The product starts as a
Next.js website, but the backend must be designed as a shared API that can also
serve future Android and iOS apps.

## Target Stack

| Area | Choice |
| --- | --- |
| Web | Next.js, TypeScript |
| API | Next.js Route Handlers first, separable Node.js API later if needed |
| Database | PostgreSQL on Amazon RDS |
| Auth | Amazon Cognito |
| Images | Amazon S3 with pre-signed URLs |
| Hosting | AWS Amplify Hosting |
| Edge/Security | CloudFront, AWS WAF |
| Email/SMS | Amazon SES, Amazon SNS |
| Logs | CloudWatch |
| Domain | Route 53 |

## Architecture Principle

Colink.nz is not a collection of separate sites per category. It is one shared
community engine with categories, permissions, ads, reports, and admin controls
layered on top.

```text
Next.js Web
Mobile Apps
Admin Panel
    |
Colink.nz API
    |
PostgreSQL + S3 + Cognito
```

## Planned Project Structure

```text
public/
src/
  app/
    auth/
    community/
    marketplace/
    jobs/
    real-estate/
    business/
    admin/
    api/
  components/
    common/
    post/
    user/
    admin/
  styles/
  lib/
  types/
  config/
database/
  schema.sql
  seed.sql
  migrations/
docs/
```

## MVP Scope

1. Sign up and login
2. Common board engine
3. Posts and comments
4. Image upload through S3 pre-signed URLs
5. Admin login
6. Admin post removal and activity logging

## Local Development

```bash
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:3000
```

Auth pages:

```text
/auth/register
/auth/login
```

The current MVP auth implementation uses a local JSON user store at
`data/users.json`, password hashing with Node `scrypt`, and a signed HttpOnly
session cookie. This keeps the flow usable during local development while
leaving clear replacement points for Amazon Cognito and PostgreSQL.

Set `KORIN_SESSION_SECRET` in `.env.local` before using persistent local test
accounts.

New members start at the `Iron` membership level. Membership levels must add
convenience, speed, capacity, and organization rather than blocking core
features.

## Next Documents

- [Architecture](docs/architecture.md)
- [API Design](docs/api-design.md)
- [Design System](docs/design-system.md)
- [Sign Up Strategy](docs/signup-strategy.md)
- [Membership Levels](docs/membership-levels.md)
- [Security Plan](docs/security-plan.md)
- [Security Checklist](docs/security-checklist.md)
- [Terms of Service](docs/terms-of-service.md)
- [Admin Guide](docs/admin-guide.md)
- [Database Schema](database/schema.sql)
