# 07 — UI spec

`DESIGN.md` is the design system (colour, type, shape, depth, motion, craft). This file specifies screens, layout, components, copy and states. On a conflict about a visual value, `DESIGN.md` wins; on layout or behaviour, this file wins; on data shapes, `docs/04-tool-contract.md` wins.

## 0. Golden rules

1. Only shadcn/ui components, Tailwind semantic classes and the tokens generated from `DESIGN.md`. No hard-coded colours, sizes or fonts; no other UI, icon or animation library (allowed additions: `@xyflow/react`, `zustand`, `sonner`, `lucide-react`).
2. Build `/styleguide` first: every token and every component state. Compare against it before every UI commit.
3. Run `pnpm check:design` before every commit. Generate tokens from `DESIGN.md` (`npx @google/design.md export --help` shows formats); do not hand-type values.
4. The UI talks only to the typed API client built from `docs/04-tool-contract.md`. Never import `src/engine` into client components.
5. Every panel has loading, error, empty and populated states.
6. Save a 1440x900 screenshot to `docs/screens/<task>.png` after each UI task and commit it.
7. Nothing in the UI may display truth data before the verdict.

## 1. Routes

`/` landing (SHOULD), `/season/1` level map, `/play/[level]` the case, `/play/[level]/verdict`, `/styleguide` (dev only).

## 2. Case screen (the main screen)

```
+----------------------------------------------------------------------------------------------+
| HEADER 56px:  Alibi · CASE FILE 03 The Blackout Dinner | Window: 9:30 | Tick 14 | [Ask the Inspector] [Accuse] |
+----------------------+--------------------------------------+--------------------------------+
| SUSPECTS (300px)     | INTERROGATION (flex)                  | FILE (flex, 560px+)            |
|  suspect cards        |  header: name, role, observations     |  Tabs: Timeline | Board | Inspector |
|  rooms list +Search   |  messages                            |         | Notes                |
|  Bait button          |  topic chips + slot picker           |                                |
|                      |  input row                            |                                |
+----------------------+--------------------------------------+--------------------------------+
```
1920x1080 and 1440x900 are the targets; below 1180px stack panels and show "Best on a larger screen". **Present mode** (`?present=1`) scales the root font 1.15, hides dev toggles and enlarges labels; it is the recording mode.

## 3. Panels

**Header.** Typewriter label ("CASE FILE 03"), level title in Playfair, murder window chip (updates when evidence revises it, with a brief stamp animation "WINDOW REVISED"), tick (tabular), primary button **Accuse**, secondary **Ask the Inspector**.

**Suspects.** One `SuspectCard` per suspect (initials avatar, name, role, chips: "3 statements", "2 observations"). Selected has a brass ring. Below: the **Rooms** list (all rooms; each with a **Search** button, disabled with a check once searched; shows "N exhibits" after). The hidden passage, once revealed, appears as a brass dashed edge in the mini map (SHOULD: an SVG mini map of the rooms; MUST: the list). **Bait** button with a "N left" chip.

**Interrogation.** Messages with the suspect's reply (and an italic observation line under it, e.g. *touches her lanyard*). The **topic chips** are the question UI: *Where were you?* (opens a slot picker 1 to 8 with the time labels), *Who did you see?* (slot picker + person picker), *Your history with {victim}?*, *About the night*, *Anything else?*. Sending a question creates the player's line ("Where were you at 9:15?") and calls `ask`. Show a typing indicator; the rest of the UI stays usable. If `status: 'nothing_new'`, show the suspect's brush-off and disable that chip combination. Every new statement briefly pulses its card on the board and its cell on the timeline.

**File tabs.**
- **Timeline** (section 4), the default.
- **Board** (section 5).
- **Inspector** (section 6).
- **Notes**: the player's own flags and hypotheses (with `by: 'player'`), plus a button "Flag this" on any contradiction. Inspector entries show a steel chip.

**Search modal/toast.** Searching a room opens a brief card stack: each exhibit appears as a polaroid with its typewriter label; the new exhibit also lands on the board. A revised window or a revealed passage gets its own stamp.

**Bait modal.** Lists the prepared announcements (typewriter label "ANNOUNCEMENT A/B/C"), a warning "You can use N more", a confirm step. After use: each reacting suspect's line with an observation; a slip adds a statement card with a SLIP stamp; an ambiguous result says "Several people reacted. This tells you little."

**Accuse modal.** Multi-select suspects (up to 4), a confirm that states the lives left ("You have 2 accusations"). Outcome screens for partial and wrong; full goes to the verdict route.

## 4. Timeline grid (the hero screen)

A table with the victim and every suspect as rows and the 8 slots as columns (time labels in mono, the window slots shaded in brass 8%). Each cell shows what the board knows about that person at that slot:
- **Soft** (a statement): a paper-coloured pill with the room name and a quill icon. **Hard** (evidence): a solid pill with a pin icon and the exhibit label. **Inferred** (elimination): a steel dashed pill with an Inspector icon.
- Two different rooms in one cell -> the cell gets a thread ring and a CONTRADICTION stamp; hover shows both sources.
- **Impossible move**: a dashed orange arrow from the earlier cell to the later one with "needs N, has M" on hover and the path (room names) in the tooltip.
- **Rehearsed group**: a brass bracket linking the identical cells across rows with the shared detail ("the bell rang twice").
- Row end shows a badge: *cleared* (green) when `checkFeasibility` is false for the window and crime scene, or *unclear*. Do not show "guilty".
- Clicking a cell focuses the corresponding card on the Board.
This is built from `getBoard`, `findContradictions`, `findImpossibleMoves`, `findRehearsedAlibis` and `checkFeasibility` (cleared badges), refreshed after every state change.

## 5. Board (React Flow)

Nodes: **Person** (avatar), **Evidence** (polaroid), **Statement** (smaller note card on paper), **Flag** (stamp), **Hypothesis** (steel card). Edges: contradiction (red thread), impossible (orange dashed), rehearsed (brass), Inspector link (steel), support (thin neutral). Auto-layout in columns by person; the player can drag cards (positions kept in the Zustand store only). New cards drop in with the 320ms entrance; a flagged pair draws its thread. Selecting any card highlights its edges and dims the rest. Controls: fit view, filter chips (Statements, Evidence, Flags, Inspector).

## 6. Inspector panel

A feed of `InspectorEvent`s: tool call rows (tool name, args), result rows (summary, rows, ms), flags and hypotheses as they are written, and a final message in plain sentences. While streaming, referenced cards on the Board and cells on the Timeline glow in steel (`highlight` ids). A button row: **What doesn't add up?**, **Could {suspect} have done it?** (person picker), **Suggest the next question**, and in the level map **Cold case** mode. Label for cold case: "Recorded run, re-executed live against the graph." The Inspector never accuses on its own; it ends with a hypothesis and a **Use as my accusation** button that pre-fills the Accuse modal.

## 7. Verdict screen

Serif headline with one italic word, stamp ("CASE CLOSED" or "NOT QUITE"), three brass stars. Left: the **replay** as a typed case summary, step by step (window; lies exposed; cleared suspects; motive paths; baits). Clicking a step highlights its `refs` and `path` on a read-only copy of the Board and Timeline. Right: **What you found** and **What you missed** with where to look. Reveals the culprits, method and weapon here only. Footer: the Season 1 arc clue as a new polaroid, and **Next case**.

## 8. Level map

Three file folders: Level 1 open; Level 2 opens after any completion of Level 1; Level 3 after Level 2 (the player may skip with a visible "Skip lock" toggle in dev only). Each shows title, tagline, mechanics taught, stars, accusations used, and a **Play** button; completed levels show the arc clue as a polaroid on a corkboard. A secondary **Cold case** button loads the pre-filled board and runs the Inspector.

## 9. Copy deck (keep in `src/lib/copy.ts`)

| Key | Text |
| --- | --- |
| tagline | Every lie leaves a path. |
| ask.where | Where were you at {time}? |
| ask.saw | Who did you see at {time}? |
| ask.motive | What was your history with {victim}? |
| ask.night | Tell me about the night. |
| ask.more | Is there anything else? |
| nothingNew | {name} has nothing more to add on that. |
| searchDone | You have already searched here. |
| windowRevised | Window revised: the murder happened at {time}. |
| passageFound | A passage nobody drew on the plan. |
| baitConfirm | You can use {n} more. Choose carefully. |
| baitAmbiguous | Several people reacted. This tells you little. |
| inspectorRecorded | Recorded run, re-executed live against the graph. |
| noPath | No path found. That is an answer, not an error. |
| accuseConfirm | You have {n} accusations left. |
| partial | You have the hand, not the head. |
| wrong | Not quite. Something on the board says otherwise. |
| closed | Case closed. |
| fw | A reply was replaced because it said more than the suspect was cleared to say. |
| llmDown | The language model is unavailable. Using the suspect's prepared statement. |
| error | Something went wrong. Try again. |

Voice: plain, dry, a little wry. No exclamation marks, no emojis, no gore.

## 10. State matrix

| Panel | Loading | Error | Empty | Special |
| --- | --- | --- | --- | --- |
| Suspects | skeleton cards | ErrorBanner + retry | n/a | search done, bait left |
| Interrogation | typing indicator | inline banner, keep the draft | "Choose a question." | firewall replaced a reply (shield note), template reply |
| Timeline | skeleton grid | ErrorBanner | "Ask someone where they were." | contradiction, impossible, rehearsed, cleared |
| Board | skeleton canvas | ErrorBanner | "Search a room or ask a question." | flagged, highlighted |
| Inspector | streaming | inline banner | "Ask the Inspector." | deterministic source chip, recorded source chip |
| Verdict | skeleton | ErrorBanner | n/a | partial, wrong, closed |

## 11. Accessibility

Text contrast at least 4.5:1; status colours always paired with an icon and a label; visible 2px thread focus ring; the Timeline is a real `<table>` with row/column headers, and the Board has a text equivalent (the Notes tab and the Timeline carry the same information); `aria-live="polite"` for the interrogation, the toast region and the Inspector stream; reduced motion honoured; 44px hit areas.

## 12. Enforcement

Same as `DESIGN.md` section 11. `scripts/check-design.mjs` (included in the pack) scans `src/` and fails on hard-coded colours, arbitrary values, inline colour styles, forbidden UI libraries and raw `<button>`. A line may opt out with `// design-ok: <reason>`. Hooks in `.githooks/` run typecheck, `check:design`, the secret scan and, when `DESIGN.md` or `cases/` changes, the design lint and the case validator.

## 13. UI build order

| Id | Task | Time |
| --- | --- | --: |
| U0 | Shell, tokens from DESIGN.md, fonts, `/styleguide`, atoms (SuspectCard, Chip, Stamp, Polaroid, ErrorBanner, EmptyState) | 2 h |
| U1 | Level map + briefing + case shell + typed API client + Zustand store | 1.5 h |
| U2 | Interrogation + topic chips + rooms/search | 2 h |
| U3 | Timeline grid | 2 h |
| U4 | Board (React Flow) with threads and stamps | 2.5 h |
| U5 | Inspector panel (SSE feed, highlights, cold case) | 1.5 h |
| U6 | Bait, Accuse, Verdict screen | 2 h |
| U7 | Polish: states, a11y, Present mode, screenshots | 1.5 h |
| L1 | Landing page (SHOULD, only after the demo path works) | 2 h |

## 14. Demo-day readiness

1920x1080, Present mode, browser zoom 100%, bookmarks hidden, notifications off; `next build && next start` for recording; `pnpm demo:reset` resets the demo player to a known state; fonts self-hosted by `next/font`; no console errors; one full dry run within the last hour; screenshots for the README (timeline with contradictions, board with threads, Inspector run, verdict replay).
