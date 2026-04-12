# Past Mistakes

When something breaks unexpectedly, record the pattern here so it doesn't happen again.

---

## 2026-04-09 — RLS blocks cross-state operations
**What:** Link-session API couldn't read anonymous assessments because RLS policy only allowed `auth.uid() = user_id`, and unclaimed rows have `user_id = NULL`. `NULL = NULL` is false in SQL.
**Pattern:** Any time you add auth to a previously anonymous table, you need transitional policies for the unclaimed→claimed handoff.
**Fix:** Added "Anyone can read unclaimed assessments" (`user_id IS NULL`) + "Authenticated users can claim" policies.

## 2026-04-09 — Web Speech API requires HTTPS on Safari
**What:** Voice input worked on Chrome localhost but not Safari. Safari requires secure context (HTTPS) for `webkitSpeechRecognition`.
**Pattern:** Always test browser APIs on the target browser. "Works on Chrome" ≠ "works everywhere."
**Fix:** No local fix possible. Works in production (Vercel = HTTPS). Added `interimResults: true` which Safari also needs.

## 2026-04-10 — Unique constraints break multi-user features silently
**What:** Shared vault sibling couldn't check in because `checkins` had `UNIQUE(user_id, parent_id, checked_at)`. Since `getVaultOwnerId()` sets user_id to the owner for all writes in a shared vault, the constraint blocked the second user completely — no error visible to the user, the insert just failed.
**Pattern:** When introducing shared-vault writes where `user_id` becomes the vault owner (not the actor), audit every unique constraint that includes `user_id`. Split the "actor" identity from the "owner" identity before it causes a silent lockout.
**Fix:** Added `checked_in_by` column (actual actor), dropped old constraint, added new `UNIQUE(checked_in_by, parent_id, checked_at)`. The actor can no longer double-click but different actors in the same vault can both check in.

## 2026-04-10 — Chrome incognito shares cookies across windows
**What:** Tried to test with two user identities in two Chrome incognito windows. Both windows stayed signed in as the same user because Chrome shares cookies across all incognito windows. `/join?token=` correctly rejected with "you can't join your own vault."
**Pattern:** For multi-user manual testing, you need Chrome Guest window, Chrome profiles, or a different browser entirely. Firefox isolates private windows, Chrome does not.
**Fix:** Tell users to use Chrome Guest (File → New Guest Window) or a second browser like Safari/Firefox for the second identity.

## 2026-04-10 — Reaching for new schema before checking existing data
**What:** User reported the share modal showed "Editor" (role) instead of the member's identity. First instinct was a migration adding `member_email` to `vault_members`. User pushed back. The label they wanted ("Mukul (brother)") was already in `vault_shares.label` in the same API response — joined to members via `claimed_by`.
**Pattern:** Before proposing any schema change or new column to fix a display issue, scan the current API response and application state for data that already solves it. Most "the UI doesn't show X" problems are "I'm not rendering data that's already loaded" problems.
**Fix:** Joined `vault_shares` and `vault_members` in JS on the API side, returned `invite_label`, displayed it. No migration. Saved as `feedback_cheapest_fix_first.md` in the auto-memory.

## 2026-04-10 (session 10) — Cloned a page structure and silently dropped a shared component
**What:** Scaffolded `/safety` from scratch using the home page as a reference. Forgot to include `<Watermark />` (the subtle background logo). User caught it during walkthrough: *"the safety page does not have the logo in the background."* The home page and `/assess` both have it; `/safety` didn't. Pure copy-paste oversight.
**Pattern:** When building a new page that borrows the visual language of an existing page, do a structural diff against at least one existing sibling — scan the first 20-30 lines for shared wrappers (Watermark, decorative backgrounds, Suspense boundaries, layout shells) and confirm you've included all of them before building out the content.
**Fix:** Added `<Watermark />` on `/safety` and included it on `/fraudguard` from the start. Verified `logo-icon.png` in the rendered HTML of both pages.

## 2026-04-10 (session 10) — `next build` catches compilation, not runtime or layout
**What:** Ran `next build` after multiple significant changes (safety page rewrite, dashboard SafetyCard add, assessment chip). Build was clean (0 errors, 1 pre-existing warning). Told the user it was ready to walk. It *was* buildable and deployable, but `next build` can't catch: missing Watermark rendering (pure copy-paste gap), responsive layout breakage on intermediate viewports, sticky-CTA padding math mistakes, chip toggle state bugs, or auth-state branches that need a live session.
**Pattern:** `next build` is necessary but not sufficient. After it passes, you still need: (1) actually load the page in `next dev`, (2) curl + grep for expected/absent strings in the SSR HTML, (3) walk the flow end-to-end against a real DB, (4) think about auth-state branches specifically (what does a signed-in vs anonymous user see), (5) check intermediate viewports, not just desktop+mobile. Saved as `feedback_validate_before_handoff.md`.
**Fix:** Built a 6-step local validation routine (dev server curl, content grep, real DB write, padding math, grid trace, handler trace) that now runs before any production deploy.

## Inherited from an earlier session — `git init` ran in the wrong directory
**What:** The `.git` for this project lives at `/Users/aditianapindi/.git` (the home folder) instead of `/Users/aditianapindi/Z/.git` (the project folder). Every commit in the repo's history is Z content (100% of the files are prefixed `Z/`) — meaning the intent was always a Z-level repo, but the `git init` was run from the parent directory by accident. Discovered in session 8 when the home-level `.gitignore` was silently ignoring files inside `Z/src/public/` because unanchored rules like `Documents/` matched `Z/documents/` on macOS's case-insensitive filesystem. Caused a stream of downstream problems: no GitHub remote can be cleanly added (pushing would leak the rest of the home folder), and the home `.gitignore` has to be babysat to not interfere with Z content.
**Pattern:** When running `git init` — especially from an AI agent or an unfamiliar terminal — always confirm the working directory with `pwd` FIRST. The failure mode is silent: `git add` works, commits land, files are tracked, everything seems fine for weeks until a `.gitignore` rule or a subtree operation reveals the mismatch. The fix once it's entrenched is a full repo extract (re-init inside the intended folder + lose or migrate history).
**Fix:** Planned for the next session — `cd Z && git init`, commit fresh history (Z only has 4 commits of Z-content, negligible history loss), then `rm -rf ~/.git` to remove the misplaced home-level repo, then create the GitHub remote inside Z and push. Secret audit of `src/.env.local` is a prerequisite before the first push.

## 2026-04-10 (session 10) — Public pages weren't auth-aware; shipped a broken vault tab flow
**What:** Added a "Safety" tab to the vault sidebar that links to the public `/safety` page. Flagged a minor UX wrinkle ("signed-in user clicking logo on /safety returns them to / not /vault") but missed the larger issue: the ENTIRE `/safety` page is auth-blind. Both CTAs ("Start your free vault" + sticky "Get started") funnel a signed-in user into `/assess?source=safety` — which starts a brand-new anonymous assessment session, telling an existing user to "start a free vault" they already have. User walked it and reported: *"the flow seems wrong — when clicking on safety from the vault, it goes back to the safety page where it is asking to take the assessment again — this is broken."*
**Pattern:** Public lead-magnet pages that are ALSO reachable from inside the authenticated surface MUST be auth-aware. The moment you make a page reachable from both anonymous LinkedIn traffic AND a tab in the authenticated vault, you have two distinct audiences and the CTAs need to branch on `useAuth()`. This is the same mistake as writing an "upgrade to pro" banner that shows to pro users — audience-aware copy has to follow audience-aware reachability.
**Fix (pending at time of writing):** Extract the auth-dependent bits of `/safety` and `/fraudguard` into client subcomponents that call `useAuth()`. Anonymous path: current "Start your free vault → /assess" CTAs. Authenticated path: "Back to my vault → /vault" CTA. Also applies to the header logo link, the sticky bar, and any "get started" affordance. Flagged separately in the backlog as a real bug + tracked as the fix blocking tonight's walk-through.
