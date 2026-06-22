# Colink.nz Architecture

## Product Direction

Colink.nz is a New Zealand Korean community platform. The first release is a web
application, but every major feature should be built through API boundaries so
future Android and iOS apps can reuse the same backend.

## Core AWS Services

| Area | AWS Service | Purpose |
| --- | --- | --- |
| Web hosting | AWS Amplify Hosting | Deploy the Next.js website |
| Auth | Amazon Cognito | Sign up, login, MFA, account state |
| Database | Amazon RDS PostgreSQL | Users, posts, comments, ads, reports |
| Images | Amazon S3 | Profile, post, and ad images |
| Security | AWS WAF + CloudFront | Edge protection and caching |
| Email/SMS | Amazon SES / SNS | Email verification and notifications |
| Logs | CloudWatch | App errors, security logs, admin activity |
| Domain | Route 53 | Production domain management |

## Application Boundaries

```text
Web UI      -> Colink.nz API -> PostgreSQL
Mobile app  -> Colink.nz API -> PostgreSQL
Admin panel -> Colink.nz API -> PostgreSQL
Uploads     -> Colink.nz API -> S3 pre-signed URL -> S3
```

The web UI must not receive special backend-only behavior. If a feature matters,
it should be exposed through the same API contract that mobile clients can use.

## Folder Strategy

```text
src/app
  auth
  community
  marketplace
  jobs
  real-estate
  business
  admin
  api

src/components
  common
  post
  user
  admin

src/lib
  db.ts
  auth.ts
  permissions.ts
  validation.ts
  upload.ts
  security.ts

src/config
  categories.ts
  userRoles.ts
  permissions.ts
  siteSettings.ts
```

## Category Model

Categories are configuration and database records. They should not become
separate hard-coded applications.

Examples:

| Board | Data model |
| --- | --- |
| Freeboard | `posts` + `category_id = freeboard` |
| Marketplace cars | `posts` + `category_id = cars` |
| Jobs | `posts` + `category_id = jobs` |
| Rent | `posts` + `category_id = rent` |

This keeps new boards cheap to add and keeps moderation, search, reports, and
ads consistent.

## User Roles

| Role | Purpose |
| --- | --- |
| `guest` | Limited read-only access |
| `member` | Basic posting and comments |
| `verified_member` | Marketplace, messages, reports |
| `business_member` | Business listing, job posts, ads |
| `moderator` | Hide posts, manage comments, handle reports |
| `admin` | Manage users, posts, ads, categories |
| `super_admin` | Manage admins, permissions, site settings |

## Build Phases

### Phase 1: MVP

- Sign up
- Login
- Board engine
- Comments
- Image upload
- Admin login
- Admin post deletion

### Phase 2: Community Stability

- Reports
- User suspension
- Ad banners
- Category management
- Search
- Location filters

### Phase 3: Differentiation

- Trust score
- Market price history
- Business verification
- Job verification
- Saved-post notifications
- Mobile apps
