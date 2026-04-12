# Post-Buildathon Backlog

Things we deliberately deferred to ship for April 15. Revisit after the first batch of real users.

---

## Streak UX — Option B (30 min, no schema)

- **14-day dots view** instead of 7 — so Monday → Tuesday transition doesn't make last week's data visually disappear
- **Welcome-back message tier** when user returns after 3+ days of silence: *"Welcome back. It's never too late to start again."*
- **Almost-there message** for 13-day streak: *"13 days — one more and it's two weeks."*
- **Why deferred:** Option A (show "longest: N" inline) captures the loss-aversion protection for 10 min of work. B is polish, not a retention fix.

## Streak UX — Option C (2+ hours, possible schema)

- Monthly heatmap (GitHub contribution-graph style)
- Store `best_streak` in `parents` or a new `streak_stats` table so we don't recompute every page load
- "Share your streak" feature for LinkedIn: *"I cared for my parents 30 days in a row — tracked with GetSukoon"*
- **Why deferred:** schema change, 2+ hours of work, and none of this helps the first 100 users decide to sign up. Pure retention polish.

---

## Per-parent access control on shared vaults

- Today: sharing is all-or-nothing. If you share your vault with your brother, he sees ALL parents including your mother-in-law.
- What we want: owner picks which parents a given invite grants access to.
- **Why deferred:** ~3 hours of careful RLS work across 9 tables. RLS bugs leak data silently — worst failure mode for a trust-based product. Not worth the risk the week before launch.
- See session-8 conversation where this was discussed at length.
- Required work:
  - `vault_member_parents(vault_member_id, parent_id)` access list table
  - `vault_members.access_mode` column: `'all' | 'selected'`
  - `vault_shares.parent_ids uuid[]` on invite
  - Rewrite `is_vault_member()` → `has_parent_access(parent_id)`
  - Update RLS on all 9 vault tables to join through parent_id
  - ShareModal needs a parent-picker checkbox list

---

## Check-in UX — who just checked in

- Today: shared family streak, but no visibility into WHO contributed on any given day
- Would like: weekly dots could color-code or annotate who checked (owner vs members)
- Or: subtitle "Mukul just checked in" when someone else was the actor
- **Why deferred:** nice-to-have, the MVP check-in mechanic already works and both users can participate

---

## Gemini document extraction

- Uploaded prescriptions and test reports sit as opaque files
- Could OCR them with Gemini, extract medicines + doctor + date, auto-link to the relevant parent
- **Why deferred:** documents feature just shipped the rails — need to see if users actually upload anything before investing in extraction

---

## Medicine "Today" reminder view

- In-app page showing "what to take right now" based on time_of_day values
- Pseudo push-notification via browser tab refresh
- **Why deferred:** no push notifications means users need to actively come to the page — low activation. Worth testing only after we confirm people open the app daily.

---

## Calendar export (.ics)

- Medicines + appointments → subscribable calendar feed
- Users get reminders in their native calendar app (which they already check)
- **Why deferred:** one more feature to build and test. Higher payoff than the in-app reminder above, but still post-launch.

---

## Assets: renewal_date UI

- Backend column exists (from upcoming-migration.sql)
- API accepts `renewal_date` on POST
- UI doesn't expose a date picker yet
- Insurance renewals won't show up in "What's coming up" until users can enter dates
- **Why deferred:** small but needs design — date picker, edit flow, placement in AssetForm

---

## Session 10 additions (updated Session 12)

### Auth-aware public pages — PARTIALLY FIXED (Session 12)

- Auth branching logic exists in `safety-client.tsx` and `fraudguard-client.tsx` — CTAs correctly show "Back to my vault" for signed-in users
- **Remaining issue:** SSR always renders anonymous CTAs, then client hydration switches after ~200ms. Cosmetic flash, not functional.
- Sign-in link added to all public page headers as a bordered pill button (Session 12)
- Logo link is auth-aware via `LogoWithAuthLink` component
- Safety tab removed from vault (Session 12) so the "navigates outside vault" issue is resolved

### FraudGuard signed APK release

- `/fraudguard` page is honest that there's no signed APK today (developer beta, builds from source)
- When the teammate cuts a signed APK + a GitHub Releases page, add a proper "Download APK" button to the mustard callout
- **Why deferred:** blocked on teammate work — GetSukoon side is ready to wire it up when the APK exists

### Real screenshots for `/safety` and `/fraudguard`

- `/fraudguard` currently has no screenshots (the SVG placeholders were removed during the /safety rewrite)
- When the teammate provides real overlay/warning screenshots, add them to the "When it triggers, three things happen at once" section
- **Why deferred:** blocked on teammate providing assets

### `?source=` query param tracking — DONE (Session 12)

- Assess page reads `?source=` from URL, includes in payload
- API writes to `assessments.source` column (migration run on prod)

### Mobile vault tab strip — RESOLVED (Session 12)

- Safety tab removed from vault. Now 7 tabs. No more cramping.

### `/safety` logo link — RESOLVED (Session 12)

- `LogoWithAuthLink` component handles this. Signed-in → `/vault`, anonymous → `/`.

### ₹22,495 Cr stat verification

- Now only appears on `/fraudguard` (in the narrative insight section about the scam window)
- Sourced from the FraudGuard README, not yet verified against I4C / MHA primary sources
- **Fix:** ask teammate where the number is sourced; if it's from a press release or I4C report, cite it; if it's unverifiable, round it or soften to "hundreds of crores"
- **Why deferred:** not blocking; acceptable risk for the current low-traffic state. Fix before LinkedIn launch

---

## Session 12 additions

### Admin Insights Dashboard — BUILD NEXT SESSION

**Route:** `/admin/insights` (hardcoded email check for access)

**Already trackable from existing tables (no schema changes):**
- Total signups + growth over time (`auth.users`, needs service-role key)
- Assessment completions + scores + sources + care_worries (`assessments`)
- Assessment → signup conversion rate (`assessments` where `user_id IS NOT NULL` / total)
- Vault item counts by type (doctors/medicines/expenses/contacts/documents/assets `created_at`)
- Check-in streaks (`checkins`)
- Shares sent / claimed / expired rates (`vault_shares`)
- Waitlist signups (`waitlist` + `abha_waitlist`)

**Needs new table — `page_views`:**
- Track: landing page visits, `/assess` opens, `/safety` visits, `/report/[id]` views
- Schema: `(id, session_id, user_id nullable, page text, referrer text, created_at)`
- New API route: `POST /api/track` (lightweight, no auth required)
- Client-side: `usePageView()` hook that fires on navigation
- This enables the full funnel: **landing → assess start → assess complete → report view → signup → vault action**

**Needs new tracking — assessment starts vs completions:**
- Currently only completions are tracked (row inserted on report generation)
- Option: fire a `page_view` for `/assess` on load = "started", then the `assessments` row = "completed"
- Drop-off = page_views for `/assess` minus `assessments` rows in same time window

**Architecture:**
- One admin API route: `GET /api/admin/insights` using Supabase service-role key
- Returns all metrics in a single JSON response
- One page: `/admin/insights` with the dashboard UI
- Email whitelist check for access (your email only)

### Scam incidents log (reconfirmed NOT building)

- Reopened briefly when user asked "didn't we discuss having a tab for scam incidents?"
- Reconfirmed the session-9 rejection: building a manual-entry incident log inside GetSukoon would duplicate FraudGuard's real-time detection as a form. Zero strategic value.
- **Only revisit if:** real users ask for "show me the last 10 scam alerts" — which is a feature of FraudGuard's alert history, not GetSukoon's vault scope
