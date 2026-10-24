# EvoGraph Nonlinear (working title) — VS Code extension

M0 checkpoint core of the non-linear interface: checkpoints of the workspace are recorded as a
branching graph in a shadow Git repo (`<workspace>/.evograph/`), with restore-to-checkpoint.

- Working title only — do not publish under "EvoGraph" (name collisions; see repo dossier).

## Develop

```bash
npm install
npm run check      # lint + typecheck + unit tests + compile
```

Press F5 to launch an Extension Development Host; it opens the repo root so you can dogfood
(checkpoints land in `.evograph/`, which is gitignored).

## M0 commands

- `EvoGraph: Create Checkpoint` — snapshot the workspace as a manual checkpoint.
- `EvoGraph: Restore Checkpoint…` — switch the workspace to an earlier checkpoint (replaces
  uncheckpointed changes after a confirmation).
- Status bar item shows the active checkpoint; click it for the action menu.

## Design and constraints

- Mini-spec: `../history/nonlinear-interface-mini-spec.md` (data model, storage layout, UI states).
- Milestones and non-goals: `../history/evograph-ide-execution-brief.md` Section 8.
- Single-root workspaces; Git >= 2.30 required; trusted workspaces only (M0).
