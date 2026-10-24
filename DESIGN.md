---
name: The Interchange Sheet
description: The checkpoint file read as a transit sheet with an orienteering course laid over it — day map and night race renditions of the same printed panel.
colors:
  course-violet: "#7b2cbf"
  course-violet-deep: "#5b1d99"
  course-flood: "rgba(123, 44, 191, 0.14)"
  course-hover-tint: "rgba(123, 44, 191, 0.07)"
  branch-blue: "#5fa7d6"
  prompt-olive: "#5f6c2d"
  applied-amber: "#8a5f00"
  paper-ground: "#f5f4f0"
  sheet-ink: "#111111"
  faded-ink: "#6f6d68"
  rule-hairline: "#d9d7d0"
typography:
  sheet-title:
    fontFamily: "Roboto Condensed Signage, Arial Narrow, Helvetica Neue, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    letterSpacing: "0.18em"
  state-title:
    fontFamily: "Roboto Condensed Signage, Arial Narrow, Helvetica Neue, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    letterSpacing: "0.14em"
  station-title:
    fontFamily: "Roboto Condensed Signage, Arial Narrow, Helvetica Neue, system-ui, sans-serif"
    fontSize: "11.5px"
    fontWeight: 700
    letterSpacing: "0.05em"
  prose:
    fontFamily: "Roboto Condensed Signage, Arial Narrow, Helvetica Neue, system-ui, sans-serif"
    fontSize: "11.5px"
    fontWeight: 400
    lineHeight: 1.5
  micro-tag:
    fontFamily: "Roboto Condensed Signage, Arial Narrow, Helvetica Neue, system-ui, sans-serif"
    fontSize: "8.5px"
    fontWeight: 400
    letterSpacing: "0.14em"
  sheet-meta:
    fontFamily: "Roboto Condensed Signage, Arial Narrow, Helvetica Neue, system-ui, sans-serif"
    fontSize: "8.5px"
    fontWeight: 400
    letterSpacing: "0.12em"
  ring-number:
    fontFamily: "Roboto Condensed Signage, Arial Narrow, Helvetica Neue, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 700
rounded:
  square: "0"
  row: "2px"
  control: "50%"
spacing:
  lane-origin: "64px"
  lane-step: "76px"
  row: "84px"
  fork-headroom: "160px"
  sheet-gutter: "14px"
  card-inset: "16px"
  label-offset: "22px"
components:
  sheet-header:
    backgroundColor: "{colors.paper-ground}"
    textColor: "{colors.sheet-ink}"
    padding: "12px 14px 9px"
    typography: "{typography.sheet-title}"
  sheet-header-count:
    textColor: "{colors.faded-ink}"
    typography: "{typography.sheet-meta}"
  sheet-footer:
    backgroundColor: "{colors.paper-ground}"
    textColor: "{colors.faded-ink}"
    padding: "9px 14px"
    typography: "{typography.sheet-meta}"
  checkpoint-station:
    backgroundColor: "{colors.paper-ground}"
    textColor: "{colors.sheet-ink}"
    rounded: "{rounded.control}"
    size: "56px"
    typography: "{typography.station-title}"
  checkpoint-station-hover:
    backgroundColor: "{colors.course-hover-tint}"
  checkpoint-station-active:
    backgroundColor: "{colors.course-flood}"
    textColor: "{colors.course-violet-deep}"
    rounded: "{rounded.control}"
  checkpoint-station-off-course:
    backgroundColor: "{colors.sheet-ink}"
    textColor: "{colors.sheet-ink}"
    size: "22px"
    typography: "{typography.station-title}"
  course-thread:
    backgroundColor: "{colors.course-violet}"
  main-trunk:
    backgroundColor: "{colors.sheet-ink}"
  branch-link:
    backgroundColor: "{colors.branch-blue}"
  ghost-leg:
    backgroundColor: "{colors.course-violet}"
  state-card:
    backgroundColor: "{colors.paper-ground}"
    textColor: "{colors.sheet-ink}"
    rounded: "{rounded.square}"
    padding: "16px 16px 14px"
    typography: "{typography.prose}"
  state-action:
    backgroundColor: "#0078d4"
    textColor: "#ffffff"
    rounded: "{rounded.square}"
    padding: "5px 12px"
    typography: "{typography.prose}"
  state-action-hover:
    backgroundColor: "#026ec1"
  context-menu:
    backgroundColor: "#252526"
    textColor: "#cccccc"
    rounded: "{rounded.square}"
    padding: "4px 0"
  context-menu-item-hover:
    backgroundColor: "#094771"
    textColor: "#ffffff"
---

# Design System: The Interchange Sheet

## Overview

**Creative North Star: "The Interchange Sheet"**

The checkpoint file is printed, not rendered. The panel is one sheet in three strips — a header that names the file, its record count and its rendition; a routed canvas; a footer legend — and everything on it obeys two printed languages at once: transit wayfinding (routes, stations, a legend, time read downward) and an orienteering course map (numbered controls, a course thread, control descriptions set in tiny caps). The ground is paper in the light theme and night in the dark theme, and the sheet names which it is: *day map* or *night race*. The theme chooses the rendition; it never changes the artifact.

Two drawings share the page. The first is the network: an ink trunk routed at true 45° elbows, alternate branches peeling right in pale blue, stations marked either as numbered control rings (on the course) or as a plain 22px ink bar (everything off it). The second is the course laid over it: one violet thread through the rings that the developer actually rode, dashed violet ghosts where an abandoned leg still hangs, and a tinted flood across the active control's row. The signature move is that the course redraws whole on every switch and the sheet inverts for 170ms — the ride is visible as one printed act, not a sequence of component updates.

Density is instrument-like. Type stays between 8.5px and 12px, uppercase almost everywhere, with hierarchy carried by weight, tracking and color rather than size. Three hairlines and one tinted band do all the layering, and there is exactly one shadow in the system — on a floating menu that is not part of the sheet. It refuses the category's dot-and-hairline git graph: routes here are 7px, turns are 45°, and every checkpoint holds a place on a course rather than a row in a list.

**Key Characteristics:**

- A sheet in three strips: header (title, record count, rendition note), routed canvas, footer legend — one 1px rule each side of the canvas.
- Transit geometry: a 76px lane step, an 84px row pitch, true 45° elbows, 7px routed trunks with a 4.5px violet thread riding on top.
- Orienteering vocabulary: numbered control rings, ghost dashes for abandoned legs, a flood on the active control, a 22px tick for everything off the course.
- Two renditions of one identity: day map and night race. Ground, ink, dim and rule follow the theme; the four accents keep their identity and only retune for contrast.
- One bundled condensed signage face, 8.5–12px, uppercase — hierarchy by weight, tracking and color.
- Depth without shadows: hairlines, a tinted band, punched rings, and layer order.
- Motion is a single event: a 170ms invert flash when the active checkpoint changes. Every other state change is hard-cut — there is not one `transition` in the stylesheet.

## Colors

A printer's palette with one voice: paper, ink and rule carry the sheet; a single violet carries the ridden path; pale blue carries the roads not taken; two dry pigments — olive and amber — appear only in the provenance micro-tag.

One palette, four renditions. Ground, ink, dim and rule are rendition-derived (paper `#f5f4f0` and black ink in light; near-black `#121417` ground and soft white ink in dark; pure `#000000`/`#ffffff` with a lifted accent set in high contrast; the inverse again in high-contrast light). The four accents keep their identity across renditions and only retune for contrast — violet `#7b2cbf` → `#9b6bd3` → `#c9a1f5` → `#5b1d99` across light, dark, high contrast and high-contrast light — and blue, olive and amber do the same. Every value recorded here is the day rendition; the header states which rendition is live.

### Primary

- **Course Violet** (#7b2cbf): the ridden path and its controls — the 4.5px course thread, every control ring and its ring number, the ghost dashes of an abandoned leg, the flood behind the active control, and the row wash under the pointer. It is the only color that means "the developer has been here".
- **Course Violet Deep** (#5b1d99): the text weight of the course color — the active station's micro-tag, where violet has to hold as type at 8.5px rather than as a mark.
- **Course Flood** (rgba(123, 44, 191, 0.14)): the 52px band behind the active control, painted under the station row so the thread and the ring show through it. It is how the sheet says *you are here* without a border.
- **Course Hover Tint** (rgba(123, 44, 191, 0.07)): the full-row wash under the pointer, one step lighter than the flood so an aimed row never reads as the current one.

### Secondary

- **Branch Blue** (#5fa7d6): alternate branches only — the 7px routed line peeling at 45° from a junction, and its key in the footer legend. It never marks state, action, selection or provenance.

### Tertiary

- **Prompt Olive** (#5f6c2d): the "AI prompt" micro-tag, and nothing else.
- **Applied Amber** (#8a5f00): the "AI applied" micro-tag, and nothing else.

### Neutral

- **Paper Ground** (#f5f4f0): the day sheet's paper — header, footer and canvas background — and the fill *inside* every control ring, so the thread passes behind the control and never through it.
- **Sheet Ink** (#111111): station names, the 7px trunk line, the 22×2px off-course tick, and the sheet's default text color.
- **Faded Ink** (#6f6d68): the sheet's small print — the record count, the footer legend, the type · time micro-tag on origin and manual records, and the state card's body copy.
- **Rule Hairline** (#d9d7d0): the 1px rule under the header and over the footer, and the 1px dashed border of a state card.

### Named Rules

**The Ridden Path Rule.** Violet is the record of the ride. The course thread, the control rings, their numbers, the ghost dashes, the flood and the hover wash are violet because the developer has been there; a violet mark that records nothing is a lie about the history.

**The Branch Borrows Blue Rule.** Blue belongs to branch lines and their legend key — nowhere else. A branch never marks selection, action, or the active checkpoint; the trunk stays ink so that "the main line" and "a line taken" are told apart by colour and not only by position.

**The Provenance Stays In The Tag Rule.** Olive ("AI prompt") and amber ("AI applied") exist for two strings at 8.5px in the micro-tag. Origin and manual records stay faded ink. A checkpoint's type never colours its line, its ring, or its row — provenance is a label on a station, never a route.

## Typography

**Signage Font:** Roboto Condensed (bundled variable latin subset, Apache-2.0; fallbacks Arial Narrow, Helvetica Neue, system-ui) — the sheet's only face.
**Platform Font:** the editor's own UI face (`--vscode-font-family`) — used by the context menu, and nothing else.
**Character:** the whole sheet speaks in one condensed signage face set in caps, 8.5px to 12px. There is no display tier, no serif and no monospace: ring numbers and timestamps are the same face as the station names. Width is the only axis that moves — the one tight tier is the station name (0.05em), the small print runs wide (0.12em to 0.16em at 8.5px), and the sheet title is the widest in the system (0.18em).

### Hierarchy

- **Sheet title** (700, 12px, 0.18em, uppercase): "Checkpoint file" in the header strip. The widest tracking in the system.
- **State title** (700, 12px, 0.14em, uppercase): the empty, error and no-folder card headings.
- **Station name** (700, 11.5px, 0.05em, uppercase): checkpoint titles on the sheet — the one tier that runs tight, because it is read as a name and not as a label. It ellipsizes on a character budget (7px per character) and never wraps.
- **Prose** (400, 11.5px, line-height 1.5): the state card's body — the only sentence-case running text in the system, and the only text allowed to wrap.
- **Micro-tag** (400, 8.5px, 0.14em, uppercase): the type · time · active line beneath each station name. Provenance lives here.
- **Sheet meta** (400, 8.5px, 0.12em, uppercase): the footer legend and the rendition note; the header's record count is the same size one step wider (0.16em).
- **Ring number** (700, 11px): the control order printed beside each ring, counting the course from the origin down to the active checkpoint.

### Named Rules

**The Twelve-Pixel Ceiling Rule.** Nothing on the sheet is larger than 12px. Hierarchy is carried by weight, caps, tracking and colour — never by a size jump. A surface that needs a 20px heading is not this sheet.

**The One Lowercase Sentence Rule.** Every string on the sheet is uppercase except the state card's body copy — the single sentence of advice, the single tier with a declared line-height, and the only text allowed to wrap onto a second line.

**The Two Voices Rule.** Exactly two faces ship: the bundled condensed signage face for the sheet and the platform's own UI face for VS Code chrome (the context menu). No third voice — no system display face, no monospace, no icon font.

## Layout

The sheet is a 100vh column — header strip, scrollable canvas, footer strip. The canvas is an SVG drawn from a routing grid, not a flow layout. Lanes start at x=64 and step 76px right for each new branch; stations sit on an 84px row pitch with up to 160px of extra headroom before a station whose predecessor forks (the fork gets air); the first row starts 30px down. The drawing's width is max(420px, outermost lane + 270px) — the 270px is the label room right of the last lane — clamped to the panel with a 300px floor. The header and footer cap at the drawing's width through a single `--sheet-width` custom property, so the chrome never stretches past the sheet even in a wide panel.

Nothing is breakpointed; the sheet re-lays out whole on resize (debounced 140ms) and recomputes lanes, rows and width together. At a 320px panel the sheet still reads: station names ellipsize with an ellipsis, the micro-tags shorten, and the footer legend drops to two rows while the header's record count stays unclipped.

Spacing rhythm: a 14px gutter on the header and footer, 16px insets inside the state card, 26px of air above it; 22px between a control's centre and its name; a 56px hit row holding a 52px flood band; 5px 12px inside the action button and 5px 14px inside a menu item. Everything else is the grid.

### Named Rules

**The Read-Down Rule.** Time runs down and branch depth runs right — the footer says it: *read down = time*. Time is never laid horizontally and the sheet is never rotated.

**The Forty-Five Rule.** Every route change of direction is a true 45° elbow: vertical, then a diagonal exactly as long as the lane offset, then vertical again. No curves, no beziers, no arcs anywhere in the routing.

**The Sheet Width Rule.** The drawing sets the sheet's width and the header and footer cap to it. Chrome never outruns the drawing, and the drawing never compresses below 300px.

**The Knockout Plate Rule.** A station's label is printed on a plate, not laid over the map: the name and micro-tag sit on a ground-coloured block drawn first in the station group, so the trunk, the branch lines, the ghost dashes and the course thread stop at the block and resume past it — while the row's own flood and hover washes still tint it. The sheet never asks the reader to choose between the line and the word: a line is never drawn across a name.

## Elevation & Depth

Flat by construction. The sheet is a printed surface — no shadows, no gradients, no translucency. Depth is carried by three things only: 1px rules (the header and footer hairlines, the dashed state-card border), one tinted band (the flood behind the active control), and the layer order of the drawing itself — trunk and branches first, ghost legs next, the course thread over them, stations on top. The control rings are punched: filled with the ground so the thread passes behind them rather than through.

Exactly one shadow ships, and it is not on the sheet: the context menu floats above it, because a menu is platform chrome drawn inside the panel.

### Shadow Vocabulary

- **Floating platform chrome** (`box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35)`): the context menu and nothing else. The sheet has no shadow vocabulary — if a new surface needs a shadow to sit above the sheet, it is platform chrome, not a sheet element.

### Named Rules

**The Flat Sheet Rule.** The sheet is flat at rest and in every state. Layering is done with 1px rules, one tinted band and draw order; the moment a sheet element needs a shadow to be legible, the hierarchy has failed, not the shadow budget.

## Shapes

Rectangles are square: header, footer, state card, action button and menu all carry 0 radius. The entire rectangle radius budget is 2px, spent three times — on the flooded band behind the active control, on its focus ring and on the station label plate. Circles belong to controls alone: a ring at r=9, r=10 at a junction (with a 15px halo at 45% violet behind it), r=11 when active with its stroke thickened from 2.5 to 3.5. Off-course records are marked with a 22×2px ink bar instead of a ring, and are never numbered. Dashes are a vocabulary, not a texture: 9/7 at 3.5px for an abandoned leg, a 4/3 miniaturisation in the footer key, and a 1px dashed border on a sheet with no records.

### Named Rules

**The Two-Pixel Rule.** 2px is the entire radius budget for rectangles in this system — the flooded row, its focus ring and the label plate. Everything else that is rectangular is square; anything that is round is a control.

**The Punched Control Rule.** A control ring is filled with the ground, not left transparent: the course thread runs *behind* the control, so each ring reads as a hole punched in the route. Circles are reserved for on-course checkpoints, and only on-course checkpoints carry numbers.

**The Dash Means Ghost Rule.** Dashes carry one meaning wherever they appear: nothing has been ridden here — an abandoned leg (9/7 dash), or a sheet with no records yet (the card's dashed border). Never decorative.

## Components

### Buttons

- **Shape:** square (0 radius).
- **The state action** — the sheet's only true button, appearing in the empty and error cards ("Create checkpoint", "Retry"): platform button tokens over the sheet's own lettering (day rendition `#0078d4` background, `#ffffff` text, `#026ec1` hover), text at 11.5px in the sheet's face, padding 5px 12px. It is the one control where platform colour and sheet type meet.
- **Hover / Focus:** hover swaps to the platform hover background; keyboard focus is a 2px outline in the platform focus colour at 1px offset.
- **No other button exists.** No secondary, no ghost, no icon button: a checkpoint is switched by pressing its row, which is why rows carry a button role of their own.

### Cards / Containers

- **The state card** (empty, error, no-folder): full width, a 1px dashed rule-coloured border, 16px 16px 14px padding, seated in a 26px 16px well. The dashed border is the sheet saying *nothing is filled in yet*. Title 12px/700 caps, body prose in faded ink, then the action button — or, in the no-folder variant, nothing at all.
- **The sheet frame:** header, canvas, footer, separated by 1px hairlines. No elevation, no rounded corners, no card chrome around the drawing.

### Navigation

- **The context menu** (right-click, or Shift+F10 / the menu key on a focused station): platform chrome inside the sheet. It keeps the platform UI face and the native menu tokens — minimum width 170px, 4px 0 padding, items at 5px 14px in 12px type, a 1px border, and the system shadow, the only shadow in the system. Two items: "Switch to this checkpoint" and "Delete…". Item hover and focus take the platform selection colours. Placement is clamped to the viewport with a 4px minimum margin, focus moves into the menu, and Escape or an outside click closes it.
- There is no nav bar, no tabs and no breadcrumb — the sheet's navigation is the map itself.

### The Checkpoint Station Row (signature)

The atom of the system: one checkpoint as a stop on the course, drawn as a mark, a name, and a micro-tag on a 56px row.

- **Mark:** on the course, a numbered control ring (violet stroke, ground fill); a junction adds the halo and takes the ring to r=10; the active station takes r=11, a 3.5px stroke, a flooded 52px band and a micro-tag switched to deep violet with "· active" appended.
- **Row:** the name sits 22px right of the control centre, 11.5px/700 caps; the micro-tag follows 15px below the name's baseline, at 8.5px with 0.14em tracking.
- **Label plate:** a ground-coloured plate (rx=2) sits behind the two-line label block — starting 16px right of the lane centre (1px clear of the widest mark, the 15px junction halo), running the estimated text advance plus 6px of air on each side, and standing 36px tall from 13px above the lane centre to 23px below it. It is the first thing drawn in the station group, so the trunk, branch lines, ghost dashes and course thread stop at the block and resume past it, while the flood and hover washes still tint it. Its width uses the same per-character advances as the ellipsis (7px for the name, 5.2px for the tag plus 3px for the separator), so the plate hugs the text as printed.
- **Hit area:** a 56px-tall invisible row, minimum 160px wide, washed with the course hover tint under the pointer. The focus ring shares the same box and the same 2px radius.
- **Focus:** the ring is painted only on `:focus-visible` — 2px in the platform focus colour — and keyboard focus is restored to the same station after a switch re-renders the sheet.
- **Pending:** a station awaiting a switch drops to 55% opacity.
- **Off course:** no ring and no number — a 22×2px ink bar, the name, the micro-tag.

### The Routed Lines (signature)

Four strokes carry the whole network, and their weights are doctrine.

- **Trunk** (ink, 7px): the main line down lane 0, built from 45° elbows; it leaves an on-course station 30px below it and stops 26px above the next one — 8px where a side is off the course — so stations read as stops rather than overlaps.
- **Course thread** (violet, 4.5px, round caps): one polyline through every control from the origin to the active checkpoint, drawn whole on every render, over the trunk and behind the stations.
- **Branch** (blue, 7px): a route that left the trunk. Same weight as the trunk, so a road not taken reads as an equal road rather than a thinner one.
- **Ghost leg** (violet, 3.5px, 9/7 dash, 80% opacity, offset 5px left): a leg that was once ridden and abandoned — drawn beside the line it left, never over it.

### The Sheet Header and Footer Legend (signature)

- **Header:** "Checkpoint file" at the left; at the right, "N records" and a rendition note — *day map* or *night race* — derived from the live theme, above a 1px rule. The sheet declares how it is printed.
- **Footer:** three miniaturised line keys (a 22×6px swatch each for course, ghost and branch), at 8.5px caps with 0.12em tracking, and "read down = time" at the far right, below a 1px rule.

## Do's and Don'ts

### Do:

- **Do** keep the layer order: trunk and branches, then ghost legs, then the course thread, then stations.
- **Do** draw the course thread whole — one polyline through every control from origin to the active checkpoint on every render. Never animate it segment by segment.
- **Do** keep the flood at 14% and the hover wash at 7% in the day rendition, so an aimed row never reads as the current row.
- **Do** keep provenance in the micro-tag: olive for "AI prompt", amber for "AI applied", faded ink for origin and manual. A type never colours a line, a ring or a row.
- **Do** keep every string uppercase, in the bundled condensed face, between 8.5px and 12px.
- **Do** let the theme choose the rendition and the header name it; retune ground, ink, dim and rule and all four accents together, never one alone.
- **Do** keep the 2px radii to the flooded band, its focus ring and the label plate, keep off-course records as a 22px tick, and keep every route turn at 45°.
- **Do** keep the hit row at least 56px tall and 160px wide, with a visible focus ring on :focus-visible.

### Don't:

- **Don't** use blue for anything but branch lines and their legend key — not for selection, not for links, not for the active checkpoint.
- **Don't** use olive or amber outside the provenance micro-tag.
- **Don't** number off-course records: numbered rings belong to the course (origin down to the active checkpoint), everything else is a tick.
- **Don't** add radii beyond 2px, shadows on the sheet, gradients or translucency.
- **Don't** set type above 12px on the sheet, or add a second face — no system display face, no monospace, no icon font.
- **Don't** restyle platform chrome: the context menu keeps the platform UI face and its native menu tokens.
- **Don't** route a line with curves, arcs or any diagonal other than 45°.
- **Don't** introduce a fourth accent to mean "selected": selection is flood + ring weight + the deep-violet tag, not a new hue.
- **Don't** lay time horizontally or rotate the sheet.
