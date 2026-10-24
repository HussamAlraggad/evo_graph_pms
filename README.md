# evo_graph_pms (working title)

One development graph as the system of record for AI-assisted coding: the IDE is the authoring
surface, the board is a projection of the same graph. This repo fuses the "passive PMS" idea
(zero manual bookkeeping; statuses follow evidence) with the non-linear interface from
"Choose Your Own Adventure: Non-Linear AI-Assisted Programming with EvoGraph" (arXiv:2604.18883):
checkpoints of code and AI interaction that branch, compare, merge, restore, and feed back as context.

Public naming is undecided — do not ship anything under "EvoGraph" (14+ name collisions; see the
dossier's disambiguation table).

## Status

- M0 (checkpoint core) scaffolded: VS Code extension in `extension/` with a shadow-git checkpoint
  store, manual + origin checkpoints, heuristic titles/descriptions, restore, persistence, and tests.
- Roadmap: M1 graph panel → M2 assistant loop → M3 compare + Review Mode + task linking →
  M4 graph-as-context + merge → M5 read-only manager web view (first PMS surface).
- Decisions, milestones, and v1 non-goals: `history/evograph-ide-execution-brief.md` Section 8.

## Repo layout

```
history/    research dossier, execution brief, mini-spec
extension/  VS Code extension (TypeScript) — M0 checkpoint core
.beads/     bd issue tracking (workflow: AGENTS.md)
```

## Quickstart (extension)

```bash
cd extension
npm install
npm run check      # lint + typecheck + tests + compile
```

Dogfood: open `extension/` in VS Code and press F5 (launches an Extension Development Host with
this repo open). The checkpoint store lands in `.evograph/` (gitignored).

## Docs

- `history/evograph-ide-research.md` — research dossier (paper ground truth, related work, PMS feasibility).
- `history/evograph-ide-execution-brief.md` — decisions and milestone plan (Section 8 = ratified fusion scope).
- `history/nonlinear-interface-mini-spec.md` — node/edge model, shadow-git layout, UI states, confirm flow.
