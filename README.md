# Tuition Finder — Expo App

The mobile app for the city-wise tuition finder. Built with Expo SDK 57, Expo Router (file-based navigation), and TypeScript. Talks to the `tuition-finder-api` Next.js backend.

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` and set `EXPO_PUBLIC_API_URL` to where your backend is running. **"localhost" will not work on a phone or emulator** — use your computer's LAN IP (e.g. `http://192.168.1.20:3000`) so your phone can actually reach it, or a deployed URL once the API is on Vercel. Your phone and computer need to be on the same Wi-Fi network for a LAN IP to work.

```bash
npm start
```

Scan the QR code with the **Expo Go** app (install it from the App Store / Play Store) to run it on your phone, or press `w` to open it in a browser.

## What's built

**Auth** — register (role: looking for a tutor / I'm a tutor), 6-digit email verification, login, token stored in SecureStore, auto-redirect between signed-in and signed-out states.

**Search tab** — browse tutors, filter by city and subject, pull to refresh.

**Tutor detail** — full profile, rating, reviews, and a "Contact this tutor" button that sends an inquiry (shows a sign-in prompt if not logged in).

**Inquiries tab** — shows *sent* inquiries for seekers, or *received* inquiries for tutors (with Mark contacted / Close actions).

**Profile tab** — account info, log out, and for tutors: create/edit your tutor profile (headline, bio, fees, city/locality, subjects, levels, teaching mode). New profiles wait for admin approval before they appear in search.

## Project structure

```
app/
  (auth)/           login, register, verify-email screens
  (tabs)/           Search, Inquiries, Profile — the main tab bar
  tutor/[id].tsx    tutor detail + reviews + contact modal
  tutor-profile/edit.tsx   a tutor's own profile form
  _layout.tsx       root layout + auth redirect guard
lib/
  api.ts            fetch wrapper, attaches the bearer token, typed errors
  auth-context.tsx  signed-in user state, login/register/verify/logout
  types.ts          types matching the backend's JSON responses
  theme.ts          colors/spacing shared across components
components/         Button, TextField, Card, Chip, Screen, EmptyState
```

## Not built yet
Password reset screen, push notifications, tutor document upload, pagination/infinite scroll on long lists (the API supports `page`/`limit`, the screens currently just show the first page), posting a "requirement" (the table exists on the backend but has no UI yet here or in the API).

## Verified before delivery
`npx tsc --noEmit` passes with no errors, and `npx expo export --platform web` successfully bundled all 1000+ modules with no resolution errors — confirming every screen and the navigation guard actually load, not just typecheck.
