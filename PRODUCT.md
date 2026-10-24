# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Solo developers who code with AI assistants — no professional/hobbyist segment gate for v1 (confirmed 2026-10-24). They work in VS Code on their own repositories, run several AI-generated alternatives before choosing one, and want to revisit, compare, and restore those alternatives without manual Git discipline or bookkeeping. The author is the first dogfooder.

## Product Purpose

A non-linear interface for AI-assisted coding: checkpoints of code and AI interaction form a branching graph the developer can branch, restore, compare, merge, and reuse as context, with inline provenance (human vs AI). Longer term the same graph is the system of record for the work itself — the IDE is the authoring surface and a read-only board is a projection of the same graph (the passive-PMS layer).

v1 success: the author dogfoods the checkpoint core on real work until the non-linear workflow is demonstrated end-to-end — the 15-minute branching acceptance scenario plus the paper's Weather Dashboard / Task Management Dashboard tasks. Porting the paper's study protocol and external users are explicitly not v1 validation routes (confirmed 2026-10-24).

## Positioning

One development graph as the system of record: the IDE authors it, the board projects it — no separate PMS database. Passivity is the contract: the system records work without asking, derives links and statuses from evidence, and only ever offers one-keystroke confirmations, never required forms. Neighboring products (agent orchestrators, kanban-over-agent-work tools, plain checkpoint tools) each hold part of this, but none could truthfully claim the combination of graph semantics, provenance, passivity, and dual-surface projection.

## Operating Context

- VS Code extension in TypeScript; the M0 checkpoint core exists in `extension/` and dogfoods via the Extension Development Host (F5) against real repositories.
- Storage: shadow Git repo at `<workspace>/.evograph/store.git`; requires Git >= 2.30, single-root workspaces, trusted workspaces. `.evograph/` is gitignored in participating projects.
- Execution: bd (beads) issues; milestones M0–M5 and non-goals in `history/evograph-ide-execution-brief.md` Section 8; data model and UI states in `history/nonlinear-interface-mini-spec.md`.
- Dogfood instrument: the paper's study tasks (Weather Dashboard, Task Management Dashboard).
- Vocabulary mirrors the paper: checkpoint, origin, active checkpoint, branch, compare with active, merge with active, graph-as-context, Review Mode, responsible node, unattributed backlog.

## Capabilities and Constraints

- Implemented (M0): shadow-git store; origin/manual checkpoints with heuristic titles/descriptions; restore; persistence; status bar + commands; 23 vitest tests.
- Planned: M1 graph panel (DAG webview) → M2 assistant loop (own minimal chat panel, pluggable LLM provider) → M3 compare + Review Mode + passive task linking → M4 graph-as-context + LLM merge → M5 read-only manager board.
- v1 non-goals (ratified): microservices; IntelliJ; budget/time-tracking; OS-level deep-work features; multi-user graph sharing/merge semantics; web editing of checkpoints; graph databases; public release under any "EvoGraph" name; `#102`-style commit parsing as the core mechanism.
- Explicitly open: webview stack for M1 (plain TS vs framework); LLM provider for titles/descriptions/merge; M5 board host — standalone web app vs VS Code webview panel (confirmed open 2026-10-24); `.evograph/annotations.json` overlay format (M3); public product name (bd `evo_graph_pms-6rb`).

## Brand Commitments

- Public name undecided; no public artifact may ship under "EvoGraph" (14+ name collisions). "EvoGraph Nonlinear" / "evo_graph_pms" are internal working titles only.
- Paper conventions to preserve in the UI: checkpoints color-coded by type, strong border on the active node, Review Mode green = human / blue = AI. The final palette is a design-system decision, not fixed by the paper.

## Evidence on Hand

- External: arXiv:2604.18883 (McGill/Polytechnique Montreal) — a 20-participant within-subjects study of the same interaction model; its results are the evidence base. No public code or artifacts exist for the paper.
- In-repo: research dossier (`history/evograph-ide-research.md`), execution brief, mini-spec, working M0 code with tests.
- Absent, and must not be fabricated: own user research, testimonials, benchmarks, adoption metrics, and any design or screenshot of a finished surface. The board (M5) has no design or implementation yet.

## Product Principles

1. Passive first: derive by default, confirm rarely, never block — nothing waits on a form.
2. The graph is the system of record: every surface is a projection of it; no parallel bookkeeping.
3. Never overwrite history: branching, merging, and linking are additive; checkpoint identities stay stable.
4. Honor the validated model: vocabulary, semantics, and provenance conventions mirror the paper unless new evidence says otherwise.
5. Solo-developer simplicity first: team and multi-user semantics stay deferred until the core is validated.

## Accessibility & Inclusion

No product-specific accessibility requirement was established. Platform expectation: webview UI follows the active VS Code theme (including high contrast) and stays keyboard-reachable.
