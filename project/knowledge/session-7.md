# Session 7 — 2026-04-10

## What was built
- **Full responsive audit** — fixed 12 touch targets below 44px, safe-area-inset for notched devices
- **Deleted dead code** — full-assessment.tsx (orphaned 200 lines)
- **Logo + branding** — custom transparent leaf icon + Fraunces "getsukoon" wordmark, centered watermark across public pages
- **Indian city autocomplete** — CityInput component with 150 top Indian cities, used in assessment + vault parent edit
- **Flexible dependents** — assessment now asks "Who are you caring for?" with add/remove rows (not hardcoded to 2 parents)
- **Report page redesign** — centered 720px column, hero score (72-84px Fraunces) with faded leaf watermark behind it, sage gradient + tinted shadow, stacked sections (score → vault CTA → insight → cost/coord → risks → numbered actions)
- **Report sections always open** — no more collapsible sections, everything visible
- **Assessment page polish** — left-aligned matching landing, Fraunces light title, readable type scale
- **Contacts parent_id** — grouped by parent with fallback to Shared/Family
- **Auth callback fix** — handles both PKCE and implicit OAuth flows

## Decisions made
- Strict type scale: Fraunces ONLY for score number, page h1, brand wordmark. Everything else DM Sans.
- Centered column layout for reading-heavy pages (report), left-aligned for editorial (landing/assessment)
- No push notifications for medicine reminders in MVP — would need Twilio/WhatsApp API ($$$)
- Run `npm run build` (not `tsc`) before every push — Vercel failures came from ESLint, Suspense, and --turbopack

## What broke / surprised us
- **Multiple failed Vercel deploys** — `--turbopack` in build script worked locally but failed on Vercel. 5.6MB Gemini logo PNG exceeded limits. ESLint errors on `@ts-expect-error` without descriptions. Unused vars treated as errors.
- **Gemini "transparent" PNGs have fake checkerboard baked in** — not real alpha. remove.bg fixed it.
- **Turbopack production builds unstable** — dev mode fine, production builds failed silently
- **Google OAuth required Supabase Site URL + Redirect URLs config** — user had to set these in Supabase dashboard

## Next session priorities
1. **Appointment schedule view** — NOT a calendar, just "what's coming up" (next doctor visits, procedures, renewals) on dashboard + Health tab
2. **Document storage (health records only)** — upload prescriptions, test reports, insurance cards to Supabase Storage. Skip wills/financial docs (security concerns)
3. **Share vault with sibling/partner** — multi-user access, invite flow, permissions (view-only vs edit)
4. **Medicine "Today" view** — in-app reminder surface (no push notifications)
5. **Calendar export (.ics)** — medicines + appointments → subscribable calendar feed
