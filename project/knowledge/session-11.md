# Session 11 — GitHub repo fix + project/ folder restructure

**Date:** 2026-04-11
**Goal:** Connect the project to GitHub cleanly so the team can see research docs, knowledge notes, and code in one place.
**Outcome:** ✅ Done. `github.com/aditianapindi/Eldercare` is now live with 29 commits, Sessions 7-10 code work caught up, and a new `project/` folder containing all research/knowledge/db/context for teammates.

---

## State at the start of the session

The session journal from Session 10 claimed:
- Vercel prod up to date ✓
- Local git at `~/.git` with 5 commits (sessions 1-10 work)
- GitHub "still not set up, by design — deferred to tomorrow"

**Reality was more tangled than that.** Two separate `.git` directories existed without anyone realizing:

1. `~/Z/src/.git` — the **real** repo, connected to `github.com/aditianapindi/Eldercare`, with 26 granular commits from Apr 9-10 (logo work, city autocomplete, auth callback fix, Family Vault initial, etc.). This was being pushed to GitHub through Session 6.
2. `~/.git` — a **misplaced** home-level repo that tracked `Z/*` as a subfolder of home, with 5 big-batch commits (sessions 1-10 grouped). No remote.

Sessions 7-10 (vault sharing, documents, upcoming feed, check-in fix, fraudguard, safety pages) were never committed into `Z/src/.git`, so they existed only as files on disk. The home-level repo "committed" them into its own copy, but that repo had no remote, so nothing reached GitHub. Meanwhile Vercel CLI kept deploying from `Z/src/` directly — production stayed current but version control rotted silently for 4 sessions.

## What I tried first (dead end)

Trusting the session journal's "misplaced home repo" framing, I ran:
```
git rev-parse --show-toplevel  # returned /Users/aditianapindi (home repo)
```
and concluded the home repo was the only one. I planned to re-root it with `git-filter-repo --subdirectory-filter Z`, push to Eldercare (presumed empty), done.

**I never ran `find ~/Z -name .git` to check for nested repos.** That one missing command caused 90 minutes of wasted planning on a rewrite that would have force-pushed over the real GitHub history, destroying 26 real commits.

The dead-end progression got as far as:
1. `brew install git-filter-repo`
2. Cloned home repo to `/tmp/eldercare-rewrite`
3. Ran `filter-repo --subdirectory-filter Z --force` — produced 4 commits at root level (the 5th was pruned because it only touched the home `.gitignore`)
4. Moved the rewritten `.git` into `~/Z/.git`
5. Wrote a `Z/.gitignore`
6. Committed the `.gitignore` as commit #5

Only then did I try `gh repo view aditianapindi/Eldercare` and discover the repo was **already full**: 26 commits, all by Aditi, up through "Fix auth callback: PKCE + implicit OAuth flows" on Apr 10. Halted immediately. No force push happened.

Then: `find ~/Z -name .git` revealed both `Z/.git` (my dead-end) AND `Z/src/.git` (the real one). `cd Z/src && git remote -v` confirmed `origin = github.com/aditianapindi/Eldercare.git`. `git status` in `Z/src/` showed 21 modified files + 10 untracked folders — the full Sessions 7-10 work, uncommitted.

## The real fix (~15 min once understood)

1. **Deleted dead-end:** `rm -rf ~/Z/.git ~/Z/.gitignore` (both built from the wrong source)
2. **Renamed home repo to safety backup:** `mv ~/.git ~/.git.bak` (kept, not deleted, in case of rollback needed)
3. **From `~/Z/src/`, secret-scanned the uncommitted diff** — only `process.env.GEMINI_API_KEY` hit (correct usage, not a leak)
4. **Committed Sessions 7-9 work** (30 files): vault sharing, documents, upcoming feed, check-in fix, ABHA waitlist, auth-widgets, all API routes and pages touched — `ff3f18c`
5. **Committed Session 10 work** (4 files): fraudguard + safety pages and client components — `7dce28a`
6. **Pushed to GitHub:** `git push origin main` — 2 commits landed
7. **Verified:** `gh api repos/.../contents/src/app/fraudguard` and `.../safety` — both folders visible on GitHub

Then, to make the repo shareable with teammates (Option 2 from the proposal):

8. **Created `~/Z/src/project/`** and moved in: `docs/`, `knowledge/`, `db/`, `CLAUDE.md`, `.claudeignore`, `idea-do-less.md`, `idea-unblock-voice.md` — everything that had been living at `~/Z/` level
9. **Committed as `3333c61`:** "Add project/ folder: research docs, knowledge notes, DB migrations, and context" (41 files, 7528 insertions)
10. **Pushed:** `git push origin main`
11. **Verified on GitHub:** `project/` folder visible with `docs/`, `knowledge/`, `db/` subfolders and `CLAUDE.md` + idea files

## What's on GitHub now (29 commits total)

```
3333c61  Add project/ folder: research docs, knowledge notes, DB migrations, and context  ← NEW
7dce28a  Session 10: Safety + FraudGuard pages                                              ← NEW
ff3f18c  Sessions 7-9: Family Vault sharing, documents, upcoming feed, check-in fix        ← NEW
1501ebf  Fix auth callback: handle both PKCE and implicit OAuth flows
243f7a0  Redesign report page: centered layout, hero score with leaf watermark
… (+ 24 earlier commits from Apr 9-10)
```

Top-level structure on GitHub:
```
/
├── src/            ← Next.js app source (unchanged)
├── public/         ← static assets (unchanged)
├── project/        ← NEW — everything for teammates
│   ├── CLAUDE.md
│   ├── .claudeignore
│   ├── db/         (11 SQL migrations)
│   ├── docs/       (discovery, market research, financial pain, product plan, style guide)
│   ├── knowledge/  (sessions 1-10 + this one, decisions, past-mistakes, backlog)
│   ├── idea-do-less.md
│   └── idea-unblock-voice.md
├── package.json
├── next.config.ts
├── tsconfig.json
└── ...
```

## What's on disk now (`~/Z/`)

```
~/Z/
├── .claude/        (Claude Code local workspace — gitignored, untracked)
├── .DS_Store       (macOS junk, ignorable)
└── src/            ← the entire project, git repo lives at src/.git
    ├── .git/       ← the ONE real repo
    ├── src/        (Next.js app source)
    ├── public/
    ├── project/    (team-shared docs)
    ├── package.json
    └── ...
```

`Z/` is now just a wrapper. All real work is inside `Z/src/`. Could rename `Z/src/` → `Z/` in a future cleanup but that requires Vercel project path reconfiguration, so deferred.

## Leftover cleanup (safe to leave until verified)

- `~/.git.bak` — safety backup of the misplaced home repo. Delete after ~1 day of confirmed operation: `rm -rf ~/.git.bak`
- `~/.gitignore` — orphan file, now inert (no repo around it). Delete: `rm ~/.gitignore`
- `~/Z/.DS_Store` — macOS junk. Delete: `rm ~/Z/.DS_Store`

## Lessons

- **Nested `.git` directories are easy to miss.** `git rev-parse --show-toplevel` only reports the *nearest* repo going UP — it will NEVER tell you about a nested repo one level down. Before trusting any git-repair plan, run `find <project-root> -name .git -type d` to get the full picture.
- **`vercel --prod` without a GitHub push keeps production alive while source control silently drifts.** We shipped 4 sessions of real work that never reached any remote. The only reason it survived is that the files stayed on the laptop. This is why the `feedback_git_before_vercel.md` rule now exists: before any direct Vercel CLI deploy, verify `git remote -v` is set and `git log origin/main..HEAD` is empty.
- **Session journals are useful but not authoritative about git state.** Session 10's end-of-session notes said "git: home-level, 5 commits, GitHub not set up." Every word was true for the home repo but it missed that `Z/src/.git` existed and was the real one. Journals capture what the author saw, not what's actually on disk. Always verify with fresh commands before acting on journal state.
- **The "simplest" fix isn't always the right fix.** I spent 90 minutes planning `git-filter-repo --subdirectory-filter Z` because it seemed cleanest. The actually-right fix was 5 commands (`rm dead-end`, `git add`, `git commit`, `git commit`, `git push`) once I understood the real state. Investigate before architecting.

## Next session prompt

See the bottom of this file for the copy-paste prompt.
