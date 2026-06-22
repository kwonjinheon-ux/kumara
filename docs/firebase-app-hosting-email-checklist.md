# Firebase App Hosting Email Checklist

Use this checklist when sign-up succeeds locally but verification email does not
arrive after deployment.

## 1. Check Where The User Is Created

Kumara currently creates MVP users in the app's own user store and sends a
6-digit verification code through SMTP. It does not create email/password users
through Firebase Auth yet.

Check both places when debugging:

```text
Firebase Console -> Authentication -> Users
App Hosting logs -> /api/auth/send-verification-email
```

If no Firebase Auth user appears, that is expected for the current local-store
flow. If the app API returns `SMTP settings are required`, App Hosting is missing
SMTP environment variables.

## 2. Authorized Domains

Firebase client auth features and OAuth redirects require the deployed host to be
authorized.

Add these domains in:

```text
Firebase Console -> Authentication -> Settings -> Authorized domains
```

Domains to add:

```text
kumara--kumara-june2026.us-central1.hosted.app
kumara-june2026.web.app
kumara-june2026.firebaseapp.com
```

Do not include `https://` or a port number. Add the custom production domain too
when one is connected.

## 3. App Hosting Environment Variables

Set these in:

```text
Firebase Console -> App Hosting -> kumara backend -> Settings -> Environment variables
```

Public build-time values:

```env
NEXT_PUBLIC_APP_URL=https://kumara--kumara-june2026.us-central1.hosted.app
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=kumara-june2026.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=kumara-june2026
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=kumara-june2026.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=...
```

Runtime secrets:

```env
KORIN_SESSION_SECRET=...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=Korin <no-reply@korin.nz>
RECAPTCHA_SECRET_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

After changing variables, create a new rollout or push a new deployment.

## 4. Email/Password Provider

If the app is later migrated to Firebase Auth email/password accounts, enable:

```text
Firebase Console -> Authentication -> Sign-in method -> Email/Password
```

That future flow must call:

```ts
await sendEmailVerification(user);
```

The current MVP flow instead calls `/api/auth/send-verification-email`, which
uses SMTP and sends a 6-digit code.

## 5. Fast Failure Signals

- User cannot register and no API email log appears: check Firebase/App Hosting
  env variables and deployment rollout.
- `/api/auth/send-verification-email` says SMTP is required: add `SMTP_HOST`,
  `SMTP_USER`, and `SMTP_PASS`.
- User receives password reset links with the wrong domain: set
  `NEXT_PUBLIC_APP_URL`.
- Google sign-in fails after deployment: add the hosted domain to Firebase Auth
  Authorized domains and Google OAuth redirect URIs.
