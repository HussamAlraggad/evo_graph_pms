# EvoGraph Nonlinear (working title) — VS Code extension

Non-linear AI-assisted coding: workspace checkpoints recorded as a branching development graph —
a "checkpoint file" you can read, switch through, and delete from, with abandoned legs kept as
ghosts. The M1 panel lives in the VS Code secondary sidebar (view container contributed via
`viewsContainers.secondarySidebar`, VS Code 1.106+).

- Working title only — do not publish under "EvoGraph" (name collisions; see repo dossier).
- Visual direction ("The Interchange Sheet") and its contract: `../.impeccable/surfaces/extension.md`;
  the user-approved first-viewport sketch: `../.impeccable/mocks/decision/assigned.html`.

## Develop

```bash
npm install
npm run check      # lint + typecheck + unit tests + compile
```

Press F5 to launch an Extension Development Host; it opens the repo root so you can dogfood
(checkpoints land in `.evograph/`, which is gitignored). The "Checkpoint File" view lives in the
secondary sidebar (right side, "EvoGraph" container).

## Commands (M1)

- `EvoGraph: Create Checkpoint` — snapshot the workspace as a manual checkpoint.
- `EvoGraph: Switch to Checkpoint…` — pick a checkpoint; uncheckpointed changes are auto-saved
  into a safety checkpoint first (no dialogs).
- `EvoGraph: Open Checkpoint File` — focus the graph panel.
- In the panel: click a station to switch; context menu (right-click or Shift+F10) to switch or
  delete (children reattach to the parent; origin cannot be deleted). Day map / night race
  follows the VS Code theme; high contrast is supported; stations are keyboard reachable.

## Preview harness

`preview/index.html` renders the panel with a stubbed VS Code API and sample data — open it in a
browser with query params
(`?theme=dark|light|hc&state=graph|empty|error|focus|switching|menu|hover|post-switch`) at
~420x900 for design iteration without launching the extension host.

## Design and constraints

- Mini-spec: `../history/nonlinear-interface-mini-spec.md` (data model, storage layout, UI states).
- Milestones and non-goals: `../history/evograph-ide-execution-brief.md` Section 8.
- Single-root workspaces; Git >= 2.30 required; trusted workspaces only (M0-M1).
