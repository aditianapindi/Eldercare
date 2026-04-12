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

## Session 10 additions

### Auth-aware public pages (BUG — should fix before launch)

- `/safety` and `/fraudguard` are reachable from both anonymous LinkedIn traffic AND the Safety tab in the authenticated vault sidebar
- Currently the CTAs and sticky bars on both pages are auth-blind — a signed-in user clicking Safety from the vault sees "Start your free vault" and is funneled back to `/assess`, which starts a brand-new assessment session
- **Fix:** extract auth-dependent bits into client subcomponents that call `useAuth()` — anonymous shows current CTAs, authenticated shows "Back to my vault → /vault"
- Applies to: hero CTA row, sticky bottom bar, header logo link (should route signed-in users to `/vault`)
- **Why deferred:** caught it at 11pm on session 10, user was going to sleep — flagged as the first thing to fix tomorrow

### Login affordance for returning users who land on a public page first

- No "Sign in" link anywhere on the public surface (`/`, `/safety`, `/fraudguard`)
- A returning user who's logged out and lands on `/safety` from LinkedIn has no way to get back into their vault — they'd have to know to type `/vault` into the URL bar, which redirects to `/` (which still has no sign-in option)
- This affects anyone who's been signed out, not just first-time users
- **Fix:** add a "Sign in" link in the header of public pages that routes to an auth-aware landing (either `/join` without a token, which already handles login, or a new `/login` route)
- **Why deferred:** raised right before bed — small but needs a decision on whether to reuse `/join` or create a dedicated `/login` page

### FraudGuard signed APK release

- `/fraudguard` page is honest that there's no signed APK today (developer beta, builds from source)
- When the teammate cuts a signed APK + a GitHub Releases page, add a proper "Download APK" button to the mustard callout
- **Why deferred:** blocked on teammate work — GetSukoon side is ready to wire it up when the APK exists

### Real screenshots for `/safety` and `/fraudguard`

- `/fraudguard` currently has no screenshots (the SVG placeholders were removed during the /safety rewrite)
- When the teammate provides real overlay/warning screenshots, add them to the "When it triggers, three things happen at once" section
- **Why deferred:** blocked on teammate providing assets

### `?source=` query param tracking

- Every CTA on `/safety`, `/fraudguard`, and the home signpost appends `?source=safety` / `?source=fraudguard`
- `/api/generate-report` doesn't read it into the `assessments` row yet
- **Fix:** single-line addition to the POST handler — read `assessment.source` or `searchParams.get('source')` and write to a new `source text` column (or reuse an existing column)
- **Why deferred:** need this before the LinkedIn launch to measure which framing converts best, but not urgent tonight

### Mobile vault tab strip at 8 tabs

- Adding the Safety tab pushed the tab strip from 7 → 8
- On a 375px phone each tab gets ~47px at `flex-1` — functional but tight for "Contacts" and "Expenses" labels
- **Options if cramped:** (a) consolidate Doctors+Health into one "Care" tab, (b) move something into a "More" overflow menu, (c) use icon-only on the narrowest screens
- **Why deferred:** need to actually walk it on a real phone before picking a fix

### `/safety` logo link for signed-in users

- Currently the logo on `/safety` always links to `/` (public home)
- A signed-in user clicking Safety from the vault → then clicking the logo → lands on the public home page instead of their vault
- **Fix:** 5-line conditional in the header — if `user` is present, link to `/vault`; else link to `/`
- **Why deferred:** part of the larger auth-aware public pages fix above

### ₹22,495 Cr stat verification

- Now only appears on `/fraudguard` (in the narrative insight section about the scam window)
- Sourced from the FraudGuard README, not yet verified against I4C / MHA primary sources
- **Fix:** ask teammate where the number is sourced; if it's from a press release or I4C report, cite it; if it's unverifiable, round it or soften to "hundreds of crores"
- **Why deferred:** not blocking; acceptable risk for the current low-traffic state. Fix before LinkedIn launch

### Scam incidents log (reconfirmed NOT building)

- Reopened briefly when user asked "didn't we discuss having a tab for scam incidents?"
- Reconfirmed the session-9 rejection: building a manual-entry incident log inside GetSukoon would duplicate FraudGuard's real-time detection as a form. Zero strategic value.
- **Only revisit if:** real users ask for "show me the last 10 scam alerts" — which is a feature of FraudGuard's alert history, not GetSukoon's vault scope
