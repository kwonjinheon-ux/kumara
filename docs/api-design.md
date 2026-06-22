# Colink.nz API Design

## API Principle

All user-facing features should be designed as API features first. The Next.js
website, admin panel, and future mobile apps must share the same API contracts.

## Public and Member APIs

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Create an account with email, email verification, password, nickname, terms agreement, and age confirmation |
| `POST` | `/api/auth/login` | Login with email and password |
| `POST` | `/api/auth/logout` | Invalidate the current session |
| `POST` | `/api/auth/verify-email` | Verify email ownership |
| `POST` | `/api/auth/verify-phone` | Verify phone ownership |
| `GET` | `/api/posts` | List posts with category, search, location, and pagination filters |
| `POST` | `/api/posts` | Create a post |
| `GET` | `/api/posts/:id` | Read a post |
| `PATCH` | `/api/posts/:id` | Update the current user's post |
| `DELETE` | `/api/posts/:id` | Soft-delete the current user's post |
| `GET` | `/api/categories` | List active categories |
| `POST` | `/api/comments` | Create a comment |
| `PATCH` | `/api/comments/:id` | Update the current user's comment |
| `DELETE` | `/api/comments/:id` | Soft-delete the current user's comment |
| `POST` | `/api/reports` | Report a post, comment, user, or business |
| `POST` | `/api/uploads/presign` | Create an S3 pre-signed upload URL |
| `GET` | `/api/me` | Return current user profile and permissions |
| `PATCH` | `/api/me/profile` | Update current user profile |
| `PATCH` | `/api/me/notifications` | Update optional notification settings |
| `POST` | `/api/likes` | Save a post |
| `DELETE` | `/api/likes/:postId` | Remove a saved post |

## Sign Up Rules

- Keep the initial sign up form limited to email, email verification, password,
  nickname, terms agreement, age 14+ confirmation, and reCAPTCHA.
- Sign up is email-only to reduce spam and simplify account recovery.
- Collect smartphone number, KakaoTalk ID, profile image, bio, interests,
  notification preferences, trade area, referral ID, residency status, and
  business details after sign up.
- Let additional verification unlock additional features instead of blocking
  account creation.
- Require email verification before marketplace posting, saved posts, and
  messages.
- Require business verification or admin approval before business listings,
  job posts, and ads.

## Admin APIs

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/dashboard` | Summary metrics |
| `GET` | `/api/admin/users` | Search and filter users |
| `PATCH` | `/api/admin/users/:id/status` | Suspend, restore, or restrict a user |
| `PATCH` | `/api/admin/users/:id/role` | Change a user role |
| `GET` | `/api/admin/posts` | Search all posts |
| `PATCH` | `/api/admin/posts/:id/status` | Hide, restore, pin, or remove a post |
| `GET` | `/api/admin/comments` | Search comments |
| `PATCH` | `/api/admin/comments/:id/status` | Hide or restore a comment |
| `GET` | `/api/admin/reports` | Review submitted reports |
| `PATCH` | `/api/admin/reports/:id` | Update report status |
| `POST` | `/api/admin/ads` | Create an ad |
| `PATCH` | `/api/admin/ads/:id` | Update an ad |
| `GET` | `/api/admin/categories` | Manage board categories |
| `POST` | `/api/admin/categories` | Create a category |
| `PATCH` | `/api/admin/categories/:id` | Update category visibility or order |
| `GET` | `/api/admin/logs` | Review admin and security logs |

## Request Rules

- Validate every body, query string, and path parameter on the server.
- Check role and ownership in each handler.
- Use soft deletes for user content by default.
- Record admin mutations in `admin_logs`.
- Keep upload URLs short-lived and scoped to a single object key.
- Never expose database IDs that are not needed by the client.

## Pagination

Use cursor pagination for feeds that can grow quickly.

```text
GET /api/posts?category=cars&limit=20&cursor=...
```

Use offset pagination only for admin tables where stable filtering and sorting
are more important than feed performance.
