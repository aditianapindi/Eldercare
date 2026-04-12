# Z — Buildathon Project

## Constraints

- **Deadline:** April 15, 10 PM IST. Live MVP + 100 real users.
- **Team:** 4 PMs (some technical). Claude Code is the primary builder.
- **Build window:** Days 1-5 build. Days 6-10 outreach + iterate.
- **The product that helps people do LESS wins.** Every feature decision filters through this.

## Stack

Next.js (App Router) + Supabase + Vercel + Tailwind CSS + Gemini 2.5 Flash.
Same stack as Nod — proven, no time to learn new tools.

## Buildathon Rules

- No auth unless absolutely necessary. Frictionless > secure for a 10-day MVP.
- No dark mode. Ship light mode only.
- No account creation. Anonymous or single-action usage.
- Mobile-first. Most users will click a LinkedIn link on their phone.
- Every page must load in <2s and deliver value in <60s.
- Track usage in Supabase (each interaction = 1 verifiable user for the buildathon).

## Product Direction (Validated)

- **Space:** Aging parent care — building for the ADULT CHILD, not the parent.
- **Wedge:** Sibling expense coordination ("who pays what for Mom & Dad?")
- **Why this wedge:** Lowest activation energy (no parent cooperation needed), recurring engagement (monthly), zero competition in India, emotionally viral on LinkedIn.
- **Expansion path:** Coordination → Financial visibility → Document vault
- **Key validated stats:** Rs 1.84L Cr unclaimed assets, 53% LIC policies lapse, 66% civil cases = property disputes, zero products in this space.
- **Research docs:** `docs/discovery-brief.md`, `docs/market-research-aging-parent-care.md`, `docs/financial-pain-validation.md` (+ HTML versions)

## Folder Structure

```
Z/
  knowledge/        # session journals, decisions, past mistakes
  docs/             # PRD, research, diagrams
  src/              # when we start building
  CLAUDE.md         # this file
```

Only README, CLAUDE.md, and config at root. Everything else in folders.

## Lessons From Nod (Apply Here)

1. **Security scaffolding ships.** No `using (true)` RLS. Explicit column selection. No secrets in URLs.
2. **Hydration kills silently.** Use `useEffect` for browser-only APIs. Start with `null` on server.
3. **Validate before handoff.** Run `/validate` before telling anyone to test. No untested handoffs.
4. **select("*") leaks data.** Always use explicit column selection in Supabase queries.
5. **Folder structure from day 1.** Already done above.
6. **Test in fresh incognito.** Close ALL incognito windows first.

## Build Priorities (This Project)

1. **Distribution > Features.** A simple product people share beats a complex product nobody sees.
2. **The output must be screenshot-worthy.** If users can't screenshot the result for LinkedIn, redesign it.
3. **Shareable by default.** Every result page should have a share button with pre-filled text.
4. **One flow, bulletproof.** Don't build 3 features at 70%. Build 1 feature at 100%.
5. **Copy matters as much as code.** The words on screen determine if someone shares or bounces.

## What NOT To Build

- User accounts / login
- Settings pages
- Admin dashboards
- Multiple themes
- Analytics dashboards (track in Supabase directly)
- Anything that isn't the core flow

## Session Protocol

End of each work session:
1. Write a session journal in `knowledge/session-N.md`
2. If something broke unexpectedly → add to `knowledge/past-mistakes.md`
3. If an architecture choice was made → add to `knowledge/decisions.md`
