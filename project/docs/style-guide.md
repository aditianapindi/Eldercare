# Eldercare Platform — Design Style Guide

*Aesop meets Notion, with Parsley Health's warmth and Apple's restraint.*

## Design philosophy

Calm, clear, and human. Borrow Apple's quiet density and Notion's structural clarity, but swap cool tech neutrals for warm, tactile, editorial materials. The interface should feel closer to a well-designed home goods catalog than a SaaS dashboard. Reassuring, never clinical. Premium, never sterile. Friendly, never childish.

## Audience considerations

Primary users include older adults and their adult children / caregivers. This shapes everything:

- Body text starts at **18px minimum**, often 20px. Never below 16px.
- Contrast targets **WCAG AAA** for body text (7:1), AA minimum for everything else. Warm does not mean low-contrast.
- Tap targets are **48px minimum**, generously spaced.
- Icons are **always paired with text labels**. No icon-only navigation.
- Plain language. No jargon, no cute product names for basic features.
- Predictable layouts. Avoid clever interactions, hover-only affordances, or gestures that aren't discoverable.

## Color palette

**Base (warm neutrals)**
- Background: `#FAF7F2` (warm cream)
- Surface: `#FFFFFF` or `#FBF8F3`
- Surface elevated: `#F5EFE6` (sand)
- Border subtle: `#EAE2D4`
- Border default: `#D6CCB8`

**Text**
- Primary: `#2A2520` (warm near-black, never pure black)
- Secondary: `#5C5448`
- Tertiary: `#8A8170`

**Accents (use sparingly)**
- Sage: `#7A8B6F` — primary actions, calm confirmation
- Terracotta: `#C26B४A` → use `#B8643F` — alerts, important highlights
- Dusty blue: `#6B82A0` — links, informational
- Mustard: `#C9A14A` — warnings, attention without alarm

Pull from Radix's `sand`, `sage`, and `sienna` scales for full ranges. Avoid saturated brand colors, gradients, and any purple→blue combinations.

## Typography

**Headlines:** Humanist serif — Fraunces, Tiempos, Source Serif, or GT Super. Generous line height (1.2–1.3).

**Body:** Humanist sans — Söhne, Untitled Sans, or as a free fallback, DM Sans or Nunito. Avoid Inter, Geist, and SF Pro for body — they read as cold and techy.

**Sizing**
- H1: 40–48px
- H2: 30–36px
- H3: 22–26px
- Body: 18–20px
- Small: 16px (never smaller for anything a user must read)
- Line height: 1.6 for body

## Layout

- Generous whitespace. Err on the side of more breathing room than feels necessary.
- Single-column where possible. Avoid dense dashboards.
- Max content width around 680–720px for reading, 1100px for app shells.
- Cards have soft borders (`#EAE2D4`), no shadows or very subtle ones (`0 1px 2px rgba(42, 37, 32, 0.04)`).
- Border radius: 8–12px. Not pill-shaped, not sharp.

## Imagery

- Real photography of real older adults — varied ages, ethnicities, body types, and contexts. No stock smiling-senior-with-laptop tropes.
- Warm, natural lighting. Documentary feel over commercial.
- If illustration is used, look to Xinmei Liu or Marta Monteiro — warm, textured, human.
- No 3D renders, no abstract gradients, no AI-generated imagery.

## What to avoid

- Purple-to-blue gradients
- Glassmorphism, neumorphism, heavy shadows
- Pure white backgrounds and pure black text
- Geometric sans for body copy
- Icon-only buttons or navigation
- Emoji as UI decoration
- Centered hero with giant gradient headline
- Generic shadcn defaults
- "Card grid of three benefits with icons" landing sections
- Patronizing language ("Don't worry!", "Easy peasy")

---

# Claude System Prompt

Paste this into your Claude project's system prompt or custom instructions:

> You are designing and building an eldercare platform serving older adults and their family caregivers. All UI you generate should follow this design language:
>
> **Aesthetic:** Aesop meets Notion, with Parsley Health's warmth and Apple's restraint. Warm, editorial, tactile, and calm. Closer to a home goods catalog than a SaaS dashboard. Reassuring, never clinical or childish.
>
> **Colors:** Warm cream background (#FAF7F2), warm near-black text (#2A2520, never pure black), sand surfaces (#F5EFE6). Accents from a muted earth palette: sage (#7A8B6F), terracotta (#B8643F), dusty blue (#6B82A0), mustard (#C9A14A). Use Radix sand/sage/sienna scales. Never use gradients, especially not purple-to-blue.
>
> **Typography:** Humanist serif for headlines (Fraunces, Tiempos, Source Serif, GT Super). Humanist sans for body (Söhne, Untitled Sans, or DM Sans / Nunito as free fallbacks). Never Inter, Geist, or SF Pro for body — they feel cold. Body text is 18–20px minimum with 1.6 line height. H1 is 40–48px.
>
> **Accessibility (non-negotiable):** Body text 18px minimum. WCAG AAA contrast for body. Tap targets 48px minimum. Every icon paired with a text label. No hover-only affordances. Plain language, no jargon.
>
> **Layout:** Generous whitespace, single column where possible, max reading width ~700px. Soft borders (#EAE2D4), 8–12px radius, minimal or no shadows. No dense dashboards.
>
> **Imagery:** Real, documentary-style photography of real older adults. No stock photos, no 3D renders, no AI imagery, no abstract gradients.
>
> **Never use:** Purple/blue gradients, glassmorphism, neumorphism, pure white/black, geometric sans for body, icon-only navigation, emoji as decoration, centered-hero-with-gradient layouts, generic shadcn defaults, three-card benefit grids, or patronizing copy.
>
> When generating components, default to Tailwind with custom values matching the palette above. When writing copy, use warm, direct, respectful language — speak to older adults as capable adults, not as fragile or confused.

---

*Revisit this guide after the first few real screens are built — some choices will need tuning against actual content.*
