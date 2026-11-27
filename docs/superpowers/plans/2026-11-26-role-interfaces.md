# Role-specific mobile interfaces

User-approved direction: implement the SVG proposals using the existing Expo/NativeWind stack. KETOAN and ACCOUNTANT represent the same accounting workspace; preserve actual server permissions. Backend/database remain unchanged.

- Route MANAGER and ACCOUNTANT to dedicated portals. Treat NORMAL USER separately from STUDENT and fail closed for unknown roles.
- Use shared FPT identity, typography, cards, accessible actions and logout, with distinct content/navigation per role.
- Manager: operations, class creation, teacher approvals. Accountant: invoices, payments and enrollment references; permission-gated mutations.
- Teacher: own classes, own availability, students. Consultant: own inbox, contact details, lead creation; edits require PATCH permission.
- Student: existing learning/enrollment/fee workflows. New user: discovery, initial enrollment, consultation. Admin: users, roles and access management.
- Verify role aliases, navigation and permission behavior; typecheck, lint, full Expo export, independent code review. Commit only task files and push current branch after verification.

## Implementation and verification — 2026-11-27

- Implemented separate navigation and workspaces for all seven business roles. ACCOUNTANT and KETOAN share the accounting workspace while retaining the permissions returned by the server.
- Added API-backed manager, accountant, teacher and consultant workflows; refreshed student learning/fees, new-user discovery/enrollment and admin access management.
- Fixed invoice creation options to exclude enrollments that already have any invoice, including cancelled invoices; invoice edits retain their original enrollment.
- `npm test`: 25 passed, 0 failed. Covers routing, permission aliases, finance totals/pagination, invoice eligibility, API mutation contracts, availability validation and existing session/logout behavior.
- `npm run typecheck`: passed. ESLint: 0 errors, 20 warnings (17 fetch/effect warnings and 3 existing import/type warnings).
- `npx --no-install expo export --platform all`: passed for web, iOS and Android.
- Isolated web UI fixture: checked role home/navigation for MANAGER, KETOAN, TEACHER, CONSULTANT, STUDENT, NORMAL USER and SUPER ADMIN, plus logout back to login including admin. The fixture used synthetic accounts and empty lists; it refused resource mutations and never contacted the live backend.
- Independent final code review found no additional significant findings after corrections.

Remaining validation: test populated data and write workflows against an authorized test backend, then exercise the native UI on a physical device. Export and fixture checks do not substitute for live end-to-end testing. Backend authorization behavior and the existing two database role records remain unchanged; the deferred iPhone-to-backend connectivity issue is outside this change.
