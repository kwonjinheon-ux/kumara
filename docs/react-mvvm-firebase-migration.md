# React MVVM Firebase Migration

## 1. Current Project Analysis

- The project is already React-based through Next.js 16, React 19, and TypeScript.
- UI, server routes, local JSON data stores, and business logic were mixed across `src/app`, `src/components`, `src/lib`, and `src/features`.
- Marketplace already had partial ViewModel logic in `src/features/marketplace/view-model`, but the main board component still owned state, loading, button actions, and API calls.
- Legacy local persistence exists in `data/`, `database/`, and `src/lib/*-store.ts`. Keep it only as a migration bridge until Firebase data is fully seeded.

## 2. React Migration Feasibility

React conversion is feasible without replacing Next.js. Next.js is React, so the safer path is progressive migration:

- Keep existing URLs and visual design.
- Move page rendering into `src/views`.
- Move UI state into `src/viewmodels`.
- Move business rules into `src/services`.
- Move Firebase calls into `src/repositories`.

## 3. Recommended Folder Structure

```text
src/
  app/                 Next route shell, Firebase singleton, route constants
  models/              User, Post, Comment, Report, Notification models
  repositories/        Firebase Auth, Firestore, Storage access only
  services/            Business logic and workflow policy
  viewmodels/          React hooks for page state and actions
  views/               Page-level React Views with module.css files
  components/          Reusable UI and feature components
  styles/              reset.css, variables.css, globals.css
```

## 4. MVVM Role Rules

- View renders UI and calls ViewModel actions.
- ViewModel owns state, loading flags, errors, filters, and button handlers.
- Service owns business decisions such as validation and workflow steps.
- Repository owns Firebase SDK calls.
- Model owns shared document shapes so web and future Flutter clients can use the same backend contract.

## 5. Firebase Connection Structure

- `src/app/firebase.ts` initializes Firebase App, Auth, Firestore, Storage, and optional App Check.
- Repositories import `firestore`, `firebaseAuth`, or `firebaseStorage`.
- Views and ViewModels do not import Firebase SDK modules directly.
- Required public env vars are `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, and optionally `NEXT_PUBLIC_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY`.

## 6. Security Draft

- Authentication: Firebase Authentication with email/password and Google provider.
- Authorization: role field in `users/{uid}.role`, with `member`, `moderator`, `admin`, and `super_admin`.
- Rules: `firestore.rules` blocks self-assigned roles, protects reports/admin data, and keeps owner checks on posts/comments/bookmarks.
- App Check: enabled in `src/app/firebase.ts` when a reCAPTCHA v3 site key is present.
- Storage: image uploads are size/type limited in `storage.rules`.

## 7. Step-by-Step Plan

1. Stabilize current Next.js app and remove generated artifacts/logs.
2. Move route rendering into `views` while preserving UI.
3. Extract state/actions into ViewModel hooks.
4. Add Firebase SDK and central `app/firebase.ts`.
5. Add repositories and services for auth, users, posts, comments, reports, and notifications.
6. Migrate local JSON data into Firestore collections.
7. Replace remaining `src/lib/*-store.ts` API routes with repository/service calls.
8. Deploy rules and indexes, then test role-based access.

## 8. Files Codex Changed

- `package.json`, `package-lock.json`
- `src/app/firebase.ts`, `src/app/App.tsx`, `src/app/routes.ts`
- `src/app/page.tsx`, `src/app/marketplace/page.tsx`
- `src/models/*`
- `src/repositories/*`
- `src/services/*`
- `src/viewmodels/usePostListViewModel.ts`
- `src/views/HomePage/*`, `src/views/PostListPage/*`
- `src/components/marketplace/MarketplaceBoard.tsx`
- `src/styles/variables.css`, `src/styles/reset.css`, `src/styles/globals.css`
- `firebase.json`, `firestore.rules`, `firestore.indexes.json`, `storage.rules`

## 9. Risks

- Firestore rules must be tested against real data before production deployment.
- Existing mojibake text should be corrected in a dedicated encoding pass.
- Existing `src/lib/*-store.ts` local JSON persistence still powers several routes and should be migrated gradually.
- Client-side Firebase writes require complete security rules and App Check configuration.

## 10. Development, Test, Deploy Commands

```powershell
npm.cmd install
npm.cmd run typecheck
npm.cmd run build
npm.cmd run dev:restart
npx -y firebase-tools@latest use <project-id>
npx -y firebase-tools@latest deploy --only firestore:rules,firestore:indexes,storage
```
