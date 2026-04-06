# Codex Implementation Prompt v1.1

You are implementing a production-quality MVP for an Italian learning web app.

Read and follow these files in order:

1. docs/00_requirements.md
2. docs/01_firestore_security_rules.md
3. docs/02_session_json_templates.md
4. docs/03_api_contracts.ts
5. this file

## Non-negotiable constraints

1. Secure by design is mandatory.
2. Do not access Firestore directly from the client.
3. All business data access must go through Next.js Route Handlers.
4. Use Firebase Admin SDK only on the server.
5. Use Firebase Authentication with Google login.
6. After login, exchange Firebase ID token for a server-side HttpOnly session cookie.
7. Do not store auth tokens in localStorage.
8. Do not expose answer keys, translations, or detailed review data before submit/review authorization.
9. Home page must show only two main cards:
   - Leggere
   - Ascoltare
   No subtitle text under those cards.
10. Ascoltare review page must have a sticky player.
11. Runtime AI calls are forbidden. Content is pre-generated only.
12. Notes must be plain text only. No HTML rendering. No dangerouslySetInnerHTML.
13. Do not use `estimatedMinutes`.
14. Do not use `difficultyLabel`.
15. Treat all learning content as approximately B2–C1 level.

## Product behavior summary

- Target: Japanese learners of Italian, B1 entry to B2, aiming toward practical C1-level comprehension.
- Main modes:
  - Leggere
  - Ascoltare
- Logged-out users can browse and start sessions.
- Logged-out users cannot save history, notes, or progress.
- Session click when logged out should show a login encouragement modal, but closing it should still allow learning.
- History should link only to review pages.
- Reattempts are started from the list pages, not from history.

## Required routes

Implement these pages:

- /
- /help
- /history
- /notes
- /leggere
- /leggere/[sessionNumber]
- /leggere/[sessionNumber]/review
- /ascoltare
- /ascoltare/[sessionNumber]
- /ascoltare/[sessionNumber]/review

Implement these APIs:

- POST /api/auth/session
- GET /api/auth/me
- POST /api/auth/logout
- GET /api/sessions?type=reading|listening
- GET /api/reading/[sessionNumber]/learning
- POST /api/reading/[sessionNumber]/submit
- GET /api/reading/[sessionNumber]/review
- GET /api/listening/[sessionNumber]/learning
- POST /api/listening/[sessionNumber]/submit
- GET /api/listening/[sessionNumber]/review
- GET /api/history
- GET /api/notes
- POST /api/notes
- PATCH /api/notes/[noteId]
- DELETE /api/notes/[noteId]
- GET /api/progress/[sessionId]
- PUT /api/progress/[sessionId]

## Required architecture

Use this structure or an equivalent one:

```text
app/
  page.tsx
  help/page.tsx
  history/page.tsx
  notes/page.tsx
  leggere/page.tsx
  leggere/[sessionNumber]/page.tsx
  leggere/[sessionNumber]/review/page.tsx
  ascoltare/page.tsx
  ascoltare/[sessionNumber]/page.tsx
  ascoltare/[sessionNumber]/review/page.tsx
  api/...

components/
  home/
  auth/
  list/
  reading/
  listening/
  review/
  notes/
  layout/

lib/
  firebase/
    admin.ts
    client.ts
  auth/
  validation/
  sessions/
  security/
  api/

types/
  api.ts
  auth.ts
  note.ts
  session.ts
```

## UI requirements

- White background
- Minimal, Notion-like spacing and typography
- PC-first responsive layout
- Small corner radius
- Avoid flashy gradients and AI-looking visual style
- Home cards can use illustration assets, but no subtitle text
- Reading learning page:
  - article-centered
  - sticky “問題を表示” button
  - bottom panel for 1-question-at-a-time answering
- Reading review page:
  - left text
  - right translation/explanation
  - top glossary accordion
  - sentence click updates right pane
- Listening learning page:
  - centered title, player, question area
  - playback only once
  - answer available only after playback starts
- Listening review page:
  - sticky player
  - 0.5 / 0.75 / 1.0 speed control
  - transcript left, explanation right
  - synced sentence highlight + auto-scroll

## Data rules

- Split content into:
  - sessions_catalog
  - sessions_learning
  - sessions_review
- review data is server-only
- notes are attached to session, not attempt
- attempts are separate per run
- learned state is true when at least one completed attempt exists
- session catalog documents must not contain `estimatedMinutes`
- session catalog documents must not contain `difficultyLabel`

## Validation rules

Add server-side validation for:
- sessionNumber
- answers payload
- note title/body/tags length
- review token
- auth/session inputs

## Security rules

- Provide a firestore.rules file with deny-all
- Add secure headers
- Add CSP
- Use HttpOnly session cookies
- Validate Origin on write endpoints
- Return 401 / 403 / 404 / 400 correctly
- Never log PII or tokens

## Seed content

Provide a seed loader or fixture mechanism that can load JSON shaped like docs/02_session_json_templates.md.

## What to produce

1. Full Next.js MVP implementation
2. Type-safe API contracts matching docs/03_api_contracts.ts
3. Minimal but polished UI matching requirements
4. Secure auth/session flow
5. Firestore Admin-based data layer
6. Seed/example content for at least:
   - one reading session
   - one listening session
7. Basic tests or verification utilities for:
   - unauthorized access rejection
   - review data not exposed before submit
   - notes/history requiring auth

## If any ambiguity remains

Prefer the more secure interpretation.
Prefer server-side enforcement over client-side assumptions.
Do not weaken security to simplify implementation.