# Firebase App Hosting Auth Checklist

Use this checklist when login, sign-up, Google sign-in, verification email, or
password reset does not work after deployment.

## 1. Authentication Users

Kumara now creates accounts with Firebase Authentication.

Check:

```text
Firebase Console -> Authentication -> Users
```

If no user appears after sign-up, check the `NEXT_PUBLIC_FIREBASE_*`
environment variables and make sure the app is pointing at `kumara-june2026`.

## 2. Sign-In Providers

These providers must be enabled:

```text
Firebase Console -> Authentication -> Sign-in method
```

Required providers:

```text
Email/Password
Google
```

The project was configured with support email `kwonjinheon@gmail.com`.

## 3. Authorized Domains

Firebase Auth and Google redirect flows require the deployed host to be
authorized.

Add these domains in:

```text
Firebase Console -> Authentication -> Settings -> Authorized domains
```

Domains:

```text
kumara--kumara-june2026.us-central1.hosted.app
kumara-june2026.web.app
kumara-june2026.firebaseapp.com
```

Do not include `https://` or a port number. Add the custom production domain too
when one is connected.

## 4. App Hosting Environment Variables

App Hosting does not read `.env.local`. These values must be present during the
Next.js build. They are already mirrored in `apphosting.yaml`.

```env
NEXT_PUBLIC_APP_URL=https://kumara--kumara-june2026.us-central1.hosted.app
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=kumara-june2026.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=kumara-june2026
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=kumara-june2026.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=77122590494
NEXT_PUBLIC_FIREBASE_APP_ID=1:77122590494:web:c552b151647afd43181b0f
```

After changing variables, create a new rollout or push a new deployment.

## 5. Email Verification And Password Reset

Sign-up calls:

```ts
await sendEmailVerification(user);
```

Password reset uses Firebase Auth action links. If links open the wrong domain,
check `NEXT_PUBLIC_APP_URL` and Authorized domains.

## 6. Fast Failure Signals

- `auth/operation-not-allowed`: enable Email/Password or Google provider.
- `auth/unauthorized-domain`: add the deployed domain to Authorized domains.
- Firebase user is created but no email arrives: check spam, Firebase Auth email
  templates, and whether the email address is valid.
- Google popup closes immediately: check popup blocking and provider setup.
