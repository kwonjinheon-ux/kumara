# Colink.nz Firebase Data Design

Kumara now uses the Firebase client SDK for member-facing auth and community
data. Keep server API routes only when a feature truly needs trusted server
logic.

## Authentication

| Flow | Firebase API |
| --- | --- |
| Email sign-up | `createUserWithEmailAndPassword` |
| Email verification | `sendEmailVerification` |
| Email login | `signInWithEmailAndPassword` |
| Google sign-up/login | `signInWithPopup` + `GoogleAuthProvider` |
| Logout | `signOut` |
| Password reset | `sendPasswordResetEmail`, `confirmPasswordReset` |

## Firestore Collections

| Collection | Purpose |
| --- | --- |
| `users/{uid}` | Public profile, role, email verification state |
| `posts/{postId}` | Marketplace/community posts |
| `posts/{postId}/comments/{commentId}` | Post comments |
| `posts/{postId}/likes/{uid}` | Per-user post likes |
| `users/{uid}/bookmarks/{postId}` | Per-user bookmarks |

## Storage Paths

| Path | Purpose |
| --- | --- |
| `users/{uid}/profile/{fileName}` | Profile images |
| `posts/{postId}/{fileName}` | Post images |

## Rules

- Public reads are allowed for marketplace content.
- Writes require Firebase Auth.
- Profile writes are owner-only.
- Post and comment edits/deletes are author-only.
- Images must be uploaded to the authenticated user's permitted path.
