# Session 9 — 2026-04-10 (planning, no code)

This session was entirely product planning and scope-locking. **No files in `src/` changed.** The next session will execute the build plan locked here.

---

## Context

Teammate independently built a separate Android app called **FraudGuard** (Kotlin, sideload-only APK, https://github.com/orangeaka/fraud-guard) during the same buildathon. It detects scam calls in real-time on the parent's phone and alerts a guardian via SMS — based on the same eldercare research that produced GetSukoon. The user (whose mother lost ₹1.5L to a KYC scam) wanted to figure out how to honor the teammate's work and incorporate the fraud angle into the GetSukoon narrative.

The conversation went through several wrong answers before landing on the right one. Recording the rejected paths here so future sessions don't re-debate them.

---

## What was decided

### 1. Don't integrate technically. Frame as a product family.

- GetSukoon and FraudGuard are **two complementary products under one mission**: *"reduce cognitive load for adult children caring for aging parents in India"*
- Each can be demoed independently
- The integration is the **thesis**, not the code
- Buildathon submission shape: **one mission, two artifacts, one shared origin story** (user's mother lost ₹1.5L to KYC scam)
- Each product has its own surface: GetSukoon = web vault for the adult child; FraudGuard = on-device guard for the parent

### 2. Drop the FraudGuard name (provisionally) — but parked

- "Guard" carries combat/defensive language; tonally wrong for a care product family where the umbrella word is "Sukoon" (peace)
- **Candidate: Sukoon Suraksha** (suraksha = safety/protection in Hindi/Urdu)
  - Real Hindi word every Indian recognizes
  - Means "protection" — accurate to what it does
  - Sits naturally as a sibling to "Sukoon"
  - Carries care energy, not combat energy
- Alternatives considered: **Sukoon Bharosa** (bharosa = trust; beautiful but abstract), **Sukoon Saathi** (saathi = companion; sounds like a chatbot)
- **PARKED** — naming requires teammate buy-in. Don't unilaterally rename someone else's work. Worst case: dual-name (FraudGuard technical, Sukoon Suraksha brand surface). For next build session, use "FraudGuard" or "the device companion" as **placeholder copy**.

### 3. Build a Safety section in GetSukoon as the bridge surface

The light-touch link that doesn't depend on the Kotlin app actually working:

**4 changes locked for next session:**

#### a. New page `/vault/safety` — static, no DB, no migrations

Structure:
- **Hero block** — 2-3 sentences with user's mother's story (₹1.5L lost to KYC scam) as the "why this exists"
- **Top 5 scam cards** — content prepared below, drop in directly
- **"What to do if it happens"** — 3 bullets including helpline 1930 + cybercrime.gov.in
- **"Protect your parent's phone"** — short description + screenshot placeholder of the FraudGuard overlay + **placeholder install instructions** (e.g., "Setup guide coming soon — contact us") until teammate sends real copy
- **Sticky CTA bar at bottom** — funnel to vault signup
- **Mid-page CTA after scam cards, before install section** — second funnel to vault signup
- **Stats footer** — only verified numbers

#### b. Safety dashboard card

- Small tile next to UpcomingCard on `/vault`
- Drives to `/vault/safety`
- Sage/mustard palette consistent with existing cards
- Copy: *"Family safety — ₹22,495 Cr lost to scams in India in 2025. Set up your parent's phone in 5 minutes."* with button *"Get safety setup →"*

#### c. Landing page section

- Add a new section **below** the main GetSukoon pitch (NOT above)
- Section header: *"And we built FraudGuard for the parent's phone."*
- 3-line story + screenshot placeholder + button to `/vault/safety`
- The main GetSukoon pitch stays the hero — don't let safety become the headline because the click-through breaks (covered exhaustively in this session)
- Do NOT redesign the landing page. ONE section. Don't restructure.

#### d. Assessment chip

- Read existing assessment/onboarding file first
- Add **"Safety & scams"** as one option in the existing multi-select question
- **Pure silent signal capture only:** save to a column on user/profile row
- **No** visible personalization, **no** score, **no** follow-up screen, **no** welcome change
- If the existing assessment doesn't have a multi-select question structure, ASK the user before adding one

### 4. Bridge the safety page back to signup so clicks don't dead-end

This is the resolution to the user's "I'm torn about LinkedIn" problem. The safety page MUST funnel into signup. Otherwise the most viral hook (mom's story) generates the lowest signups.

- **Sticky CTA bar at bottom of `/vault/safety`:** *"Set up your family vault in 60 seconds — track health, money, and safety in one place. [Get started →]"*
- **A second mid-page CTA** after the scam cards, before the install section: *"Already worried about your parents? Start your free family vault."*
- The page is a **lead magnet**, the vault is the **product**. The page exists to convert, not just inform.

---

## What was rejected (don't re-debate next session)

- **Integrating FraudGuard as a download/install from inside GetSukoon.** Sideload-only APK + 8 sensitive permissions on a 65-year-old's phone is a hard no. Cannot Play Store in 5 days. Distribution math doesn't work.
- **Building a Safety Hub with a `safety_incidents` table.** Earlier draft included a full incident log with chips, dates, amounts, resolved status. Rejected because the teammate already built the safety detection product — building a parallel logging tool inside GetSukoon would compete with their work and devalue it. **Static page only.**
- **Pivoting GetSukoon to be a fraud product, or building fraud as a parallel buildathon project.** Two products in 5 days = neither ships. Stack mismatch. Validated work would get abandoned.
- **Using fraud as the primary GetSukoon launch story (single hook).** Earlier I suggested this; user correctly pushed back that the click-through wouldn't deliver on the promise (vault is not a fraud-protection product). Resolution: safety is **one of multiple LinkedIn framings**, not the only one.
- **Adding fraud as a standalone yes/no question on the first assessment screen.** Too heavy as an opener; triggers guilt before user has experienced any value. Wrong emotional sequence for a care product.
- **Calculating a "fraud risk score" for the user.** Robs agency, feels like an insurance form, no actionable output.
- **Visible personalization based on the assessment chip** (e.g., "we added a Safety section because you picked this"). Deferred to post-buildathon. Buildathon scope is silent capture only.
- **Renaming FraudGuard unilaterally.** Naming requires teammate consent. Parked.
- **Adding `/vault/safety` as a new tab in `vault/layout.tsx`.** For now reachable from the dashboard card and from the landing section, that's enough. Don't expand the tab strip.

---

## LinkedIn distribution strategy (for after build)

User was torn: safety story is the most viral hook, but the vault is where signups happen. Resolution:

**Don't pick one. Run multiple posts from multiple PMs.** Different framings, different days, different landing surfaces:

| Post | PM | Hook | Lands on | Funnel |
|---|---|---|---|---|
| 1 | User | Mother's ₹1.5L story | `/vault/safety` | Sticky CTA → vault signup |
| 2 | Teammate A | Sibling coordination story | Home page | → vault signup |
| 3 | Teammate B | ₹1.84L Cr unclaimed assets stat | Home or `/vault/assets`-themed landing | → vault signup |

**Track signups per source via `?source=safety`, `?source=siblings`, `?source=assets` query params** in Supabase. Let data decide which framing wins. Don't guess, measure.

The product is already built. Each post is ~200 words. This is not 3x the work — it's parallelizable across the team.

---

## Content prepared (drop straight into the page next session)

### Top 5 scams

| Scam | How it works | Red flag |
|---|---|---|
| **Digital arrest** | Video call from "CBI/customs/RBI" claiming parent's name is in a money laundering case. Demands transfer to a "safe account" while keeping them on call for hours. | No real Indian agency arrests anyone over a video call. Ever. |
| **KYC update** | SMS or call from "your bank" saying KYC expired, account will be frozen in 24 hours. Sends a phishing link or asks to install AnyDesk/TeamViewer. | Real banks never ask for OTP, PIN, or remote access. |
| **Courier / FedEx** | Caller claims a package in parent's name was found with drugs/contraband. Transfers to "Mumbai customs / Mumbai police." | No courier company calls about contraband. They don't have that authority. |
| **Family emergency** | "Aunty, your son met with an accident, send money to this hospital." Often uses voice cloning. | Always call your child directly on their known number first. |
| **Lottery / refund** | "You've won ₹25 lakh in KBC lottery / IT refund / SBI rewards. Pay processing fee to claim." | You cannot win a lottery you didn't enter. |

### Stats and resources (verify each before publishing)

- **₹22,495 Cr lost to cybercrime in India in 2025** — number from FraudGuard's README. **Ask teammate where it's sourced.** If unverifiable, fall back to I4C / cybercrime.gov.in published data.
- **National Cybercrime Helpline: 1930** — real, government-run, durable. Anyone who lost money in the last 24 hours has a real chance of recovery if they call this number fast. **Put it prominently.**
- **cybercrime.gov.in** — official Indian government cybercrime portal for filing complaints. Real, durable, fine to link.
- **2024 Pune digital arrest case** — verify exact figure (~₹3.55 Cr was widely reported but check). Could be the hero stat.

**DO NOT fabricate stats.** This is a trust page on a trust product. One wrong number collapses the whole thing.

---

## Pending from session 8 (not yet done)

1. **End-to-end test on production deploy** — user said they will run this themselves before the next build session. Test steps in `knowledge/session-8.md` Part 3 → "Still pending" → item 1. If anything breaks, fix that BEFORE building anything new in session 10.
2. **Get presentable install instructions from teammate** — for the "Protect your parent's phone" section. Until then use placeholder copy.
3. **Discuss naming with teammate** — propose "Sukoon Suraksha" as the brand surface for buildathon submission. Don't dictate. Accept whatever they say. Worst case dual-name.

---

## Estimated next-session scope

- 4 things to build: ~2.5 hours
- Plus assessment chip: ~30 min once existing assessment file is read
- **Total: ~3 hours of focused build work** (excluding the user's E2E test)

---

## Files to load at the start of next session

- `knowledge/session-9.md` (this file)
- `knowledge/session-8.md` — what was shipped last session
- `knowledge/decisions.md` — including new session-9 entries
- `knowledge/post-buildathon-backlog.md`
- `CLAUDE.md` — project constraints
