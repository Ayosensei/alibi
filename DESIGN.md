---
version: alpha
name: Alibi
description: Case-file noir. Warm black canvas, paper evidence cards, red thread for contradictions, brass for provenance, serif headlines with italic emphasis.
colors:
  background: "#0A0908"
  surface-1: "#110F0D"
  surface-2: "#181513"
  surface-3: "#211D1A"
  border: "#2B2622"
  border-strong: "#3A332D"
  text-primary: "#F3EEE6"
  text-secondary: "#B3AA9E"
  text-tertiary: "#968D81"
  primary: "#D13636"
  primary-hover: "#E24A4A"
  primary-pressed: "#B82C2C"
  on-primary: "#FFFFFF"
  thread: "#FF7A70"
  brass: "#C9A45C"
  on-brass: "#1A1405"
  paper: "#E9E1D3"
  ink: "#1B1713"
  inspector: "#86B6C9"
  danger: "#F2555A"
  success: "#5CCB8B"
  status-contradiction: "#FF7A70"
  status-rehearsed: "#C9A45C"
  status-impossible: "#E58F3A"
  status-cleared: "#5CCB8B"
  status-inferred: "#86B6C9"
typography:
  display-xl:
    fontFamily: Playfair Display
    fontSize: 56px
    fontWeight: 600
    lineHeight: 60px
    letterSpacing: -0.02em
  display-lg:
    fontFamily: Playfair Display
    fontSize: 40px
    fontWeight: 600
    lineHeight: 44px
    letterSpacing: -0.015em
  display-md:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: 600
    lineHeight: 34px
  headline:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 600
    lineHeight: 26px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
  label:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: 500
    lineHeight: 16px
    letterSpacing: 0.01em
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
  typewriter:
    fontFamily: IBM Plex Mono
    fontSize: 12px
    fontWeight: 500
    lineHeight: 16px
    letterSpacing: 0.08em
  mono-md:
    fontFamily: IBM Plex Mono
    fontSize: 13px
    fontWeight: 400
    lineHeight: 20px
rounded:
  sm: 6px
  md: 10px
  lg: 14px
  xl: 20px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 32px
  3xl: 48px
  4xl: 64px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: 12px
    height: 40px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
  button-primary-pressed:
    backgroundColor: "{colors.primary-pressed}"
    textColor: "{colors.on-primary}"
  button-secondary:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.text-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: 12px
    height: 40px
  button-ghost:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: 12px
    height: 40px
  card:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: 8px
  card-inner:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: 16px
  panel:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: 16px
  polaroid:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: 12px
  input:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: 12px
    height: 40px
  chip:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 8px
  chip-thread:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.thread}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 8px
  chip-brass:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.brass}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 8px
  chip-inspector:
    backgroundColor: "{colors.surface-3}"
    textColor: "{colors.inspector}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: 8px
  trace-row:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text-secondary}"
    typography: "{typography.mono-md}"
    rounded: "{rounded.md}"
    padding: 8px
---

# Alibi design system

Single source of truth for how Alibi looks. Coding agents read this before any UI work, follow it exactly, and run `npx @google/design.md lint DESIGN.md` after editing it. Layout, screens and component behaviour are in `docs/07-ui-spec.md`; **this file wins on colour, type, shape, depth, motion and craft rules.** This is a deliberately different identity from any other project: warm black and paper, not cool blue-black and glass.

## 1. Overview

**Identity: "Case-File Noir."** A detective's desk at night: a warm-black room, evidence on paper, a red thread joining things that cannot both be true. Calm, tactile and precise, with a typewriter label here and a serif headline there. It must feel like a finished game *and* a serious reasoning tool.

Colour is meaning:
- **Thread red** (`thread`, and `primary` for fills) means conflict: a contradiction, an impossible move, a primary action.
- **Brass** means provenance and pattern: the source of a claim, a rehearsed alibi, a stamp.
- **Paper** is a physical thing: evidence and statements are paper cards (polaroids) on the board. Paper is the only light surface in the product.
- **Inspector steel** (`inspector`) belongs to the AI Inspector alone: its trace, its flags, its voice.
- **Green** means cleared. Orange means impossible travel.

**Signature moments (design with extra care):**
1. **The thread.** When a contradiction is flagged, a red thread draws between two cards (stroke animation, 320ms) and a small "CONTRADICTION" stamp lands on it.
2. **The timeline grid.** People by time slots, with conflicting cells ringed in thread red and impossible journeys drawn as dashed orange arrows. This is the screen a judge understands in three seconds.
3. **The Inspector's run.** Tool calls appear one by one in steel blue, each with the cards it touches lighting up on the board.
4. **The verdict.** A serif headline with one italic word ("The thread *led* to Clara."), the replay as a typed case summary, paper stamps, three brass stars.

## 2. Colors

All values are in the front matter.
- **Surfaces** step `background` -> `surface-1` (panels) -> `surface-2` (cards, inputs) -> `surface-3` (raised, hover, selected). Depth comes from layered shadows, not bright borders.
- **Text:** `text-primary` for content, `text-secondary` supporting, `text-tertiary` for hints and metadata only (4.5:1 on `surface-3` and above).
- **Primary** `#D13636` is a *fill* (white text, about 4.9:1). On dark surfaces use **thread** `#FF7A70` for text, strokes and glows (about 7.8:1).
- **Brass** `#C9A45C` for provenance and rehearsal; `on-brass` for text on brass fills.
- **Paper** `#E9E1D3` with **ink** `#1B1713` text for evidence cards only. Never use paper for panels or buttons.
- **Status colours** (`status-*`) appear only on flags, stamps and timeline cells, always with an icon and a text label.
- Never introduce a new colour. Add a token here first.

Alpha effects in CSS: hairline `rgba(243,238,230,0.06)`, strong hairline `rgba(243,238,230,0.12)`, thread glow `rgba(255,122,112,0.35)`.

## 3. Typography

- **Playfair Display** (600, and *italic*) for display only: level titles, verdict headline, empty-state titles. One italic emphasised word per headline.
- **Inter** for all UI text. **IBM Plex Mono** for ids, query names, trace rows, times, and **typewriter labels** ("CASE FILE 03", "EXHIBIT B", stamps) in tracked small caps.
- Load with `next/font/google`: `Inter`, `IBM_Plex_Mono`, `Playfair_Display` (normal and italic). Record any substitution on the styleguide page.
- Rules: `tabular-nums` on every changing number (ticks, ms, counts, times); `text-wrap: balance` on headings and `pretty` on paragraphs; antialiased; sentence case everywhere except typewriter labels; max line length 68ch.

## 4. Layout

- 4px base grid; only `spacing` tokens (4, 8, 12, 16, 24, 32, 48, 64).
- Target 1920x1080 (video) and 1440x900. Case screen shell in `docs/07-ui-spec.md`.
- One focal point per screen: the timeline or the board during play, the replay during the verdict.
- Hit areas at least 44px; dense controls may look smaller but extend their hit area.
- Optical alignment: icons next to text are nudged to sit on the cap height.

## 5. Elevation and depth

- **Card:** `0 0 0 1px rgba(243,238,230,0.06), 0 1px 1px rgba(0,0,0,0.5), 0 12px 32px -12px rgba(0,0,0,0.75), inset 0 1px 0 rgba(243,238,230,0.04)`.
- **Polaroid:** the card shadow plus a slightly larger drop (`0 18px 28px -14px rgba(0,0,0,0.8)`) and a rotation of -1.5 to +1.5 degrees chosen deterministically from the card id (no random re-rotation on render).
- **Floating** (tooltip, popover, toast): `0 0 0 1px rgba(243,238,230,0.10), 0 8px 24px -4px rgba(0,0,0,0.8)`.
- **Thread glow** on a flagged card or the highlighted path: `0 0 0 1px rgba(255,122,112,0.4), 0 0 32px -6px rgba(255,122,112,0.35)`.
- Background: flat `background` with one faint warm vignette (`primary` at 5%, top-left) and optional 2% paper noise. No other gradients.

## 6. Shapes

Concentric radii: outer = inner + padding. Panels and cards `xl` (20) around inner surfaces `lg` (14) with 6 to 8px padding; controls `md` (10); polaroids and stamps `sm` (6); chips, avatars, badges `full`. Never give a parent and a nested child the same radius.

## 7. Components

- **Buttons.** Primary (`primary`, white text) for the one main action per region. Secondary `surface-3`. Ghost for tertiary. Height 40. Pressed scales to 0.96; focus-visible is a 2px `thread` ring with 2px offset; disabled 40% opacity.
- **Polaroid (evidence and statement cards).** `paper` surface, `ink` text, a typewriter label on top ("EXHIBIT C", "STATEMENT"), a small photo-like header band in `surface-3` with an icon, body in Inter, source line in IBM Plex Mono. Flagged state: thread glow and a rotated stamp.
- **Thread.** A 2px curved SVG path in `thread` between two cards; dashed in `status-impossible` for impossible moves; brass for rehearsed groups; steel for Inspector-authored links. Drawn with `stroke-dashoffset`.
- **Stamp.** Typewriter text in a 2px outlined rounded rectangle, rotated -3 degrees, colour by status ("CONTRADICTION", "RUMOUR?", "IMPOSSIBLE", "CLEARED", "SLIP"). Lands with a 200ms scale 1.15 to 1.
- **Suspect card.** Initials avatar (inset outline), name, role, a row of chips (statements count, tells noticed). Selected: a brass ring.
- **Folder tabs** for the right-hand area: text tabs with a 2px `primary` underline that slides.
- **Trace row.** Mono, `surface-2`, an agent dot (`inspector` for the Inspector, `text-secondary` for the engine), query id, rows, ms (tabular).
- **Chat bubble.** Player right on `surface-3`; suspect left on `surface-2` with a 2px left border in `brass`. Under a suspect line: a muted "observation" in italic (`text-tertiary`), e.g. *touches her lanyard*.
- **Tooltip, toast** (sonner): floating shadow, `surface-3`.
- **Code/Cypher card** (README, styleguide): `surface-1`, mono, `thread`/`brass`/`text-secondary` only.

## 8. Motion

Motion explains cause and effect. Durations 120ms (hover, press), 200ms (tabs, stamps), 320ms (threads, panels). Easing `cubic-bezier(0.22, 1, 0.36, 1)`. Specific properties only; **never `transition: all`**. State toggles use CSS transitions (interruptible); keyframes only for one-shot entrances. Entrances: opacity, `translateY(8px)`, `blur(4px)` to rest over 320ms; lists stagger 40ms per item (cap 400ms). Exits are subtler and faster (160ms). Polaroids settle with a 2 degree rotation ease. Honour `prefers-reduced-motion` (no stroke animation, no blur or translate, static stamps). No parallax, bounce, confetti or sound.

## 9. Craft checklist (every component)

1. Concentric radii. 2. Shadows for depth, borders only for structure. 3. Tabular numbers on changing values. 4. `text-wrap: balance` / `pretty`. 5. Press scale 0.96. 6. Specific transition properties. 7. Stagger entrances, subtle exits. 8. 44px hit areas, visible focus. 9. Optical alignment. 10. Avatars get a 1px inset outline. 11. No layout shift (reserve space). 12. Contrast: text at least 4.5:1, UI strokes at least 3:1; `design.md lint` passes.

## 10. Do's and Don'ts

**Do**
- Use only tokens from this file as CSS variables and Tailwind theme values; add a token first when something is missing.
- Keep paper for evidence and statements only; keep thread red for conflict only.
- Pair every status colour with an icon and a label.
- Show real ids, ms and rows in the trace; show the tool name the Inspector used.
- Make empty, loading and error states as polished as the full state.

**Don't**
- Don't use pure white or pure black, a light theme, or a second accent hue.
- Don't use `primary` as text on dark surfaces.
- Don't use gradients beyond the vignette, or glows other than the thread glow.
- Don't use emojis, stock art, skulls, blood or gore (PG-13, non-graphic).
- Don't use ALL CAPS body text; typewriter labels only.
- Don't colour or label tells as reliable or unreliable.
- Don't nest cards more than two levels.
- Don't use arbitrary values (`bg-[#...]`, `text-[13px]`).
- Don't add a UI library, icon set or font not named here.
- Don't ship a screen that is not on `/styleguide`.

## 11. Enforcement

`npx @google/design.md lint DESIGN.md` when this file changes (the pre-commit hook runs it); `pnpm check:design` scans `src/` for hard-coded colours, arbitrary values and forbidden libraries; the `/styleguide` route renders every token and component state; 1440x900 screenshots after each UI task go in `docs/screens/`. DESIGN.md is an alpha format: run `npx @google/design.md spec` once, fix what `lint` reports (key names, section order, extra sections), and never delete a rule to pass lint without moving it elsewhere.
