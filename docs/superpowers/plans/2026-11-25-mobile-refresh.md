# FPT Mobile interface and flow implementation plan

**Goal:** Refresh the existing mobile app in the FPT orange/blue style and correct verified integration issues.

**Architecture:** Keep Expo Router, NativeWind, Redux and existing backend endpoints. Share navigation styling and reusable UI; keep backend and web read-only. The user delegated visual choices and authorized implementation in this chat.

## Constraints
- Preserve pre-existing changes in `app/admin/[module].tsx` and `src/api/index.ts` and exclude those files from this commit.
- No dependency upgrades or backend changes. Never commit environment files.
- Keep current role destinations, protect authenticated routes, and show actionable loading failures.

## Tasks
- [x] Add regression tests for invoice statuses and role routing. Fix unpaid counts and filters against backend `UNPAID` status.
- [x] Centralize session restoration, protect role groups, and make refresh failure terminate reliably.
- [x] Refresh shared buttons, inputs, cards, headers, empty/loading states, and all role tab bars. Refresh login and student dashboard; propagate common styles across mobile screens.
- [x] Replace example banking details with explicit optional environment configuration and an honest unavailable state. Correct calendar week boundaries if confirmed.
- [x] Run regression tests, typecheck, lint and Expo bundle export; review only task changes; commit and push current branch if checks and authentication allow.

## Review focus
- Unpaid, paid, partial and cancelled invoice states must not share the same action.
- Opening a protected route without a session must lead to login; expired sessions must clear Redux as well as storage.
- API failures must not look like zero unpaid invoices or no classes.
- Small phones, safe area insets, keyboard and long Vietnamese labels must remain usable.
- Missing bank configuration must never show example payment details as real instructions.

## Validation limits
Bundle/type checks do not prove real-device cookie behavior, bank ownership or end-to-end database flows; these need a configured backend and device session.

## Verification results
- `npm test`: 7 passing tests for invoice states, role destinations, session notification, concurrent token refresh, failed refresh/retried 401, and missing/complete payment configuration.
- `npm run typecheck`: passed.
- ESLint: 0 errors, 17 warnings (existing async effect loading patterns and existing API/type warnings). The effect compiler recommendation is configured as a warning while these callback-based fetch patterns remain.
- `npx expo export --platform all`: Android, iOS and web exported successfully.
- Browser: 390px login and registration layouts inspected, empty login validation observed, unauthenticated direct `/invoices` navigation redirected to `/login`.
- Independent review findings (retried 401 and duplicate header safe area) fixed and rechecked.
- Production dependency versions unchanged; added Expo-compatible lint tooling only.
- Real-device login/cookie persistence, database-backed enrollment and payment reconciliation remain unverified. Backend cannot currently supply a daily session calendar; mobile labels this limitation.
