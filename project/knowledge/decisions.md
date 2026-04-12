# Architecture Decisions

Record every significant choice here. Format: what was decided, what was rejected, why.

---

## 2026-04-06 — Stack
**Decision:** Next.js (App Router) + Supabase + Vercel + Tailwind + Gemini 2.5 Flash
**Rejected:** New stack, no-code tools
**Why:** Proven from Nod build. No time to learn new tools in a 10-day sprint.

## 2026-04-06 — Category
**Decision:** AI productivity — content/advice noise triage
**Rejected:** Aging parents (distribution mismatch), Creator economy (audience mismatch), Generic AI productivity (too crowded)
**Why:** Distribution channel is LinkedIn DMs to aspiring PMs. Product must solve a pain the DM recipient has RIGHT NOW. Content overload is universal and acute.

## 2026-04-06 — Product thesis
**Decision:** "The product that helps people do LESS wins." Anti-tool — subtracts instead of adds.
**Rejected:** Another AI summarizer, another productivity tool that helps you do more
**Why:** Research showed 83% of workers overwhelmed by information. Every existing tool adds to the pile. Nothing helps people decide what to IGNORE.

## 2026-04-07 — Category Pivot
**Decision:** Pivot from "Do Less" (content noise triage) to Aging Parent space
**Rejected:** Staying with content noise / AI productivity
**Why:** Team of 4 PMs, multiple members personally managing aging parent situations. Market is $30B+ with only $22.5M in startup funding. Every existing product builds for the parent — nobody builds for the adult child. Goal shifted from "just 100 users" to "pitchable startup that resonates deeply."

## 2026-04-10 — Vault sharing: membership-based RLS, not column rename
**Decision:** Add `vault_members` table + `is_vault_member()` helper. RLS on every vault table becomes `auth.uid() = user_id OR is_vault_member(user_id)`. `user_id` column stays as "vault owner".
**Rejected:** Rename `user_id` → `vault_id` across 9 tables; introduce a separate `vaults` table.
**Why:** Column rename is ~9 table migrations + data backfill + every API route updated + high risk of breaking existing owners. Membership-based RLS is additive — owners' behavior unchanged, members get a new access path. Single subquery cost is fine for a few hundred users.

## 2026-04-10 — Share link MVP over email invites
**Decision:** Single-use tokens with 48h expiry, delivered via copy-link-to-clipboard (then WhatsApp etc). No email invite infra, no email verification roundtrip.
**Rejected:** Email invite with pending invites table, SMTP/Resend, token link in email.
**Why:** ~60% less work. Siblings already share things via WhatsApp in India. Email delivery adds a failure point (deliverability, spam folder) with no product benefit. Single-use + 48h mitigates forwarding risk.

## 2026-04-10 — Family streak, not personal streak
**Decision:** When multiple users are in a shared vault, the streak is computed as distinct dates across all check-ins. Each user sees the same number.
**Rejected:** Per-user streaks visible side-by-side.
**Why:** Product thesis is sibling cooperation, not competition. Personal streaks create an implicit scoreboard — the sibling who travels more sees a worse streak and feels guilty. That's the exact dynamic this product should prevent, not amplify. Still fixed the lockout bug by splitting `checked_in_by` from vault owner `user_id` so both siblings can participate; they just see the same family number.

## 2026-04-10 — Per-parent access control deferred
**Decision:** Sharing is all-or-nothing (entire vault) for MVP. Owner cannot grant a sibling access to Mom but not mother-in-law.
**Rejected:** Building `vault_member_parents` access list + rewriting RLS on 9 tables to join through parent_id + ShareModal parent-picker checkbox UI.
**Why:** ~3 hours of RLS work, and RLS bugs leak data silently — worst failure mode for a trust-based care product. 5 days to deadline, zero real users yet. Better to ship vault-level sharing, see if anyone complains about the privacy limitation, and build per-parent access in response to actual feedback. Documented in `post-buildathon-backlog.md`.

## 2026-04-10 (session 9) — Two products, one mission framing
**Decision:** Treat GetSukoon and the teammate-built FraudGuard Android app as two complementary products under one mission ("reduce cognitive load for adult children caring for aging parents in India") rather than integrating them technically. Build a static `/vault/safety` page in GetSukoon that links to FraudGuard with honest install instructions and a screenshot.
**Rejected:** APK download from web (impossible without Play Store), deep links, building a `safety_incidents` table inside GetSukoon, building a parallel detection tool, single-product merge, pivoting GetSukoon to be a fraud product.
**Why:** Stack mismatch (Next.js web vs Kotlin Android), distribution mismatch (sideload-only APK can't reach 100 users in 5 days), trust risk (unsigned APK on a 65-year-old's phone fails badly), and teammate ownership (FraudGuard is their work — building a parallel safety log inside GetSukoon would compete with and devalue their effort). The integration is the **thesis**, not the code. Two artifacts, one origin story (user's mother lost ₹1.5L to a KYC scam), unified pitch deck.

## 2026-04-10 (session 9) — Safety section as conversion lead magnet, not standalone info page
**Decision:** `/vault/safety` page must include a sticky bottom CTA and a mid-page CTA, both funneling to vault signup. The page is the lead magnet, the vault is the product.
**Rejected:** Static information-only page with no signup funnel.
**Why:** LinkedIn safety hook (the user's mother's story) is the most viral framing available, but the click is wasted if the landing doesn't convert. Without the bridge, the most viral hook generates the lowest signups. Safety page = top of funnel, vault = bottom. Resolves the "I'm torn between viral reach and conversion" tension.

## 2026-04-10 (session 9) — Fraud signal in onboarding via multi-select chip, not standalone question
**Decision:** Add "Safety & scams" as one option in the existing multi-select onboarding question. Silent signal capture only — save to a column on user/profile row. No score, no visible personalization, no follow-up screen.
**Rejected:** Standalone yes/no on the first assessment screen, fraud risk quiz with a calculated score, immediate dashboard personalization based on the answer ("we added a Safety section because you picked this").
**Why:** A direct fraud question in onboarding triggers guilt before the user has experienced any value — wrong emotional sequence for a care product. Chip-based approach captures signal silently, treats fraud as one care concern among several (not the headline), and is reversible. Visible personalization deferred to post-launch when there's real conversion data to inform it.

## 2026-04-10 (session 9) — Naming of the device companion product parked
**Decision:** Defer renaming FraudGuard. Use "FraudGuard" or "the device companion" as placeholder copy in next session's build. Discuss "Sukoon Suraksha" (suraksha = safety/protection in Hindi) with the teammate after the buildathon submission scope is clearer.
**Rejected:** Unilateral rename without teammate buy-in.
**Why:** The teammate built and named FraudGuard. Renaming someone else's work without consent damages team dynamics more than a brand mismatch helps the pitch. Worst case path: dual-name (FraudGuard technical name in the codebase, Sukoon Suraksha as the brand surface in the pitch deck and landing page). Don't fight that battle this week.

## 2026-04-10 (session 10) — `/safety` at top-level, not `/vault/safety`
**Decision:** Build the safety page as a public `/safety` route, not as `/vault/safety` as session-9 specified.
**Rejected:** Following session-9's `/vault/safety` path literally.
**Why:** `vault/layout.tsx` has a client-side auth wall (`if (!loading && !user) router.replace("/")`). A LinkedIn visitor landing on `/vault/safety` would be bounced back to `/` before ever seeing the page. That defeats the entire lead-magnet purpose. Caught it before scaffolding. The public `/safety` is reachable by both anonymous and authenticated visitors; the dashboard card and vault tab both link to it without duplication.

## 2026-04-10 (session 10) — Landing page FraudGuard mention: slim in-hero signpost, not a dedicated section
**Decision:** Present the companion app on `/` as a single-line signpost inside the hero column, below the CTA, with a thin `border-t` separator. No dedicated section, no gradient card, no screenshot, no competing button.
**Rejected:** (1) Big mustard gradient section below the hero (initial build; felt force-fitted), (2) 4th stat card in the "Why this matters" column, (3) Removing the mention entirely.
**Why:** The gradient-card version competed visually with the hero (dark button vs sage button, screenshot placeholder, kicker pill) and created narrative whiplash — the hero pitches an assessment and the new section suddenly said "fraud! Android app!" with no thesis bridge. The 4th stat card was tonally inconsistent with the other 3 stats (which all support the hero's assessment thesis, not scam-prevention) and would have lent credibility to an unverified stat. The slim signpost matches the hero's "five questions most families never talk about" voice by literally framing safety as "one more conversation worth having" — continuing the hero's thread rather than interrupting it.

## 2026-04-10 (session 10) — `/fraudguard` as a local info page, not a direct GitHub link
**Decision:** Build a standalone `/fraudguard` page on the GetSukoon site with install instructions, "what it watches for," "how it works," and an honest "Developer beta" callout. The primary `See the app →` link from `/safety` points to `/fraudguard`, not the teammate's GitHub directly. A secondary link inside `/fraudguard` sends devs to the GitHub repo.
**Rejected:** Linking `/safety`'s "See the app" directly to `https://github.com/orangeaka/fraud-guard`.
**Why:** Non-technical visitors landing on a GitHub code page will bounce — it looks like code, not a product. A local page lets us (a) translate the README into Sukoon's voice, (b) be honest about the developer-beta state without overclaiming, (c) keep the sticky vault CTA visible so fraud-interested visitors still get a path to signup, (d) make the rename to Sukoon Suraksha a one-file edit when the teammate approves. The README content was fetched via raw curl (gh CLI wasn't authenticated) and adapted — technical bits like `./gradlew assembleDebug` stay on GitHub, user-facing first-time-setup steps come to the page.

## 2026-04-10 (session 10) — Safety tab in vault sidebar — reverses session-9's hard NO
**Decision:** Add a "Safety" tab as the 8th entry in `vault/layout.tsx`'s tab strip, linking to `/safety` (public). Added matching `SafetyIcon` shield SVG. Does NOT create a `/vault/safety` route.
**Rejected:** (1) Keeping the session-9 NO absolute, (2) Building the scam incidents log + `safety_incidents` table.
**Why:** Session-9's rejection was specifically about adding a new `/vault/safety` route that would sit behind the auth wall, duplicate the public `/safety` page, and break the LinkedIn funnel. This tab-add does none of those things — it's one link in the tab strip pointing to the already-existing public route. Different spirit entirely. The trigger to reopen was the user asking "didn't we discuss having a tab for this?" during the walkthrough — evidence that the dashboard `SafetyCard` alone is weak signposting. Safety is a legitimate care category alongside health, money, docs; it deserves equal weight in the vault chrome. The scam incidents log remains rejected because it duplicates FraudGuard's real-time detection as a manual-entry form — zero strategic value.

## 2026-04-10 (session 10) — "Safety essentials" as the product-description qualifier
**Decision:** Use **"health, money and safety essentials"** as the vault's product description on the `/safety` hero subhead (and in the sticky CTA secondary line). Applied in 3 places for consistency: `/safety` hero subhead, `/safety` sticky CTA, `/fraudguard` sticky CTA.
**Rejected:** (1) Bare "safety" as a list item (overclaims), (2) "records" / "everything you need in an emergency" (doesn't use the word "safety" on a safety-themed page).
**Why:** The vault doesn't actively prevent scams — FraudGuard does. Putting bare "safety" in the product description would implicitly promise scam-blocking the vault can't deliver. But a safety-themed page needs the word "safety" in the product line or it feels disconnected. "Safety essentials" is the honest qualifier: the vault stores emergency contacts, insurance, ICE info, helpline numbers — all safety essentials — and that's exactly what's promised. It also happens to be what the vault already supports today.

## 2026-04-10 (session 10) — Care worries chip: Option B (chip row below concern, silent capture only)
**Decision:** Add a multi-select "Worries" chip row directly below the existing concern textarea on `/assess`. 5 options (Health / Money / Safety & scams / Loneliness / Legal & paperwork). Same pill style as the Living/Siblings rows. Saved to a new `care_worries text[]` column on the `assessments` table via `db/care-worries-migration.sql`. Gemini prompt does NOT receive it. No visible personalization, no score, no follow-up screen.
**Rejected:** (1) Adding a brand-new diagnostic question (changes the 5-question structure), (2) Deferring entirely (loses the signal), (3) Piping it into the Gemini prompt for personalization (violates session-9's "silent capture only" rule).
**Why:** The existing assessment has zero multi-select questions — only 5 single-select diagnostic pills and a free-text concern field. Per session-9's explicit instruction I stopped and asked before inventing structure. Option B adds the chip without touching the diagnostic flow, reuses the same pill component, and captures signal silently. The `assessments` row already gets claimed by `user_id` via `/api/link-session` at signup time, so this column travels with the user automatically — cheapest interpretation of "save to a column on user/profile row" with zero new tables.
