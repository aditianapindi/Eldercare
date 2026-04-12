# Session 5 — 2026-04-09

## What was built
- **Family Vault** — full authenticated dashboard behind the assessment
  - Auth: Google OAuth + email/password via Supabase Auth (PKCE flow)
  - Auth callback page, session linking (anonymous assessment → authenticated user)
  - Parent profiles with avatars (gender-aware), inline editing (name, age, city, living situation, health conditions), delete, stats badges (medicines, doctors, expenses)
  - Doctor directory: add/delete, specialty pills, tap-to-call
  - Medicine schedule: grouped by time of day with visual icons (sunrise/sun/sunset/moon), "with food" vs "empty stomach" visual cards, voice input (Web Speech API), doctor dropdown with inline "Add new doctor"
  - Family contacts: grouped by role (family, neighbor, driver, maid, emergency), tap-to-call
  - Expenses tracker: recurring vs one-time, per-parent or shared, category grouping, monthly total
  - Daily check-in per parent with streak tracking
  - Vault layout: sidebar on desktop, bottom tabs on mobile (Home, Doctors, Medicines, Expenses, Contacts)
- **Assessment consolidation** — all 5 questions + personalization on one page (horizontal pills, compact layout). Down from 7 screens to 1.
- **6 new DB tables** (parents, doctors, medicines, family_contacts, checkins, expenses) with RLS
- **8 API routes** (parents CRUD + stats, doctors, medicines, contacts, checkins, expenses, link-session)

## Decisions made
- Auth gates only the vault, not the assessment or shared reports
- Parents pre-filled from assessment data, but also manually addable (in-laws, grandparents)
- Expenses default to "Shared" but can be tagged per-parent
- Living situation + siblings moved from assessment to vault (editable profile fields)
- City, ages, concern kept in assessment (Gemini needs them for personalization)
- Voice input uses Web Speech API (free, built-in) — requires HTTPS, so Safari only works in production

## What broke / surprised us
- RLS blocked session linking — anonymous assessments couldn't be read by authenticated users. Fixed with "Anyone can read unclaimed assessments" policy.
- Duplicate parent profiles created when link-session called twice. Fixed dedup check.
- Web Speech API doesn't work on Safari over HTTP (localhost). Works on HTTPS (production).
- `useSearchParams()` needs Suspense boundary in Next.js 15 static generation.

## Next session
1. Deploy to Vercel and test full flow end-to-end (assess → report → sign in → vault)
2. OG images for report pages (LinkedIn/WhatsApp previews)
3. Mobile test all vault pages on 375px viewport
4. LinkedIn share button on report page
5. Polish: Coming Soon cards → actual features? Health report uploads?
