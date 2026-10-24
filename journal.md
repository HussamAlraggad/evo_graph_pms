# Journal

## 2026-10-24 (cont. 3) -- impeccable init completed (PRODUCT.md)

### What was done

- User ran `impeccable init` (subagent session) after the M0 scaffold push: `PRODUCT.md` created at the repo root with the `impeccable:product-schema 1` marker. Platform `web`; v1 success = author dogfooding (porting the paper's study protocol and external users are explicitly not v1 validation routes). Open items recorded there: M5 board host (standalone web app vs VS Code webview panel), M1 webview stack, LLM provider, annotations overlay format, public name.
- No `DESIGN.md` written (init never writes one); no `.impeccable` config needed (no image generation, app screens are code-first); live mode skipped (no runnable web surface yet).

### Interface changes made

- None (documentation only).

### What I struggled with / broke

- Nothing.

### Test status

Not applicable — no code changed.

### Handoff to next agent

- `PRODUCT.md` (repo root) is the product record, governed by the impeccable skill — do not hand-edit it or `DESIGN.md`; use the impeccable flows (no `impeccable context` rerun needed).
- Next: dogfood M0 (open `extension/` in VS Code, press F5, run the 15-minute branching scenario), then request the M1 graph panel via `/impeccable shape` (bd `evo_graph_pms-mnd`).

## 2026-10-24 (cont. 2) -- Session 3: fusion scope ratified + M0 checkpoint core scaffolded

### What was done

- Ratified the fused product with the user (PMS idea + non-linear interface as one product): one development graph as the system of record; IDE authoring surface first (M0-M4); read-only manager web view last (M5). v1 = solo developers; passivity = passive-first with optional one-keystroke confirms.
- Appended Section 8 to `history/evograph-ide-execution-brief.md`: decision table, M0-M5 map with bd IDs, explicit v1 non-goals (microservices, IntelliJ, budget service, OS deep-work, multi-user merge, graph DB, public "EvoGraph" naming).
- Wrote `history/nonlinear-interface-mini-spec.md`: node/edge model (schema-ready task nodes; reserved types), shadow-git storage layout (refs, scratch index, exact git plumbing), metadata-encoding decision (message-embedded JSON + per-checkpoint refs; deviates from the brief's notes suggestion, rationale in spec Section 3.4), UI states M0-M5, passive-first confirm flow, acceptance + test plan.
- Scaffolded M0 in `extension/`: VS Code extension (TypeScript); shadow-git store (`<workspace>/.evograph/store.git`); engine with origin/manual checkpoints, heuristic titles/descriptions, restore (checkout + untracked cleanup + empty-dir pruning), persistence; status bar + commands; 23 vitest tests; lint/typecheck/compile configs; F5 launch config; extension README.
- bd: claimed and rescoped `evo_graph_pms-ldj` (M0); filed M1-M5 (`evo_graph_pms-mnd`, `-0zj`, `-uzg`, `-dpk`, `-m8r`) chained by blocking deps; filed docs extraction (`evo_graph_pms-em9`) and naming (`evo_graph_pms-6rb`).
- Refreshed root `README.md`; extended `AGENTS.md` (execution state, impeccable guardrail, extension dev notes).

### Interface changes made

- `CheckpointMeta`/`Checkpoint` (schemaVersion 1; reserved `taskId`); checkpoint types origin/manual/ai_prompt/ai_applied.
- `ShadowGitStore` (ensure/getActiveOid/setActive/addCheckpointRef/listCheckpointRefs/snapshotWorktreeIntoIndex/writeTree/commitTree/readCommit/listCommits/diffNames/restoreTree).
- `CheckpointEngine` (getActiveCheckpoint/listCheckpoints/createCheckpoint/restoreCheckpoint) with pluggable `CheckpointSummarizer` (heuristic implementation shipped).
- Storage layout: `.evograph/store.git` (bare), `refs/evograph/active`, `refs/evograph/checkpoints/<uuid>`, `scratch.index`.

### What I struggled with / broke

- `git for-each-ref` does not support `%x1f` escapes (only `git log --format` does); ref listing parsed empty OIDs and cascaded into a `git log` failure. Fixed with a literal tab separator; captured as an AGENTS.md rule.
- TypeScript 6.0: `moduleResolution: node` (node10) now errors as deprecated; moved to NodeNext. TS 6 also stopped auto-including `@types/node` for src-only configs; fixed with explicit `"types": ["node"]`.
- `@types/vscode` caret resolved to 1.140 while the engines floor is `^1.90.0`; pinned 1.90.0 exact to match the floor.
- vitest warned about ESM syntax in a CommonJS-loaded `vitest.config.ts`; renamed to `vitest.config.mts`.
- Lint caught an unused `statusBar` parameter in `showStatusMenu`; removed.

### Test status

```
npm run check (extension/): lint clean; tsc -p tsconfig.test.json clean;
vitest run: 3 files, 23/23 tests passed; tsc -p . compile clean.
```

### Handoff to next agent

- M0 scaffold is code-complete but NOT yet dogfooded in a live Extension Development Host: open `extension/` in VS Code, press F5, run the 15-minute branching scenario (brief Section 4 acceptance). Findings become new bd issues.
- `impeccable init` runs immediately after this session (user-run): it creates `PRODUCT.md` at the repo root — do not hand-edit `PRODUCT.md`/`DESIGN.md`; use the impeccable flows.
- Next bd work: `evo_graph_pms-mnd` (M1 graph panel) after M0 dogfood; webview stack decision is open (mini-spec Section 8).
- `git push` and `bd dolt push` were NOT run — waiting for explicit user permission (global git rule).

## 2026-10-24 (cont.) -- Focus clarification: the non-linear interface

### What was done

- User clarified the repo focus: **EvoGraph IDE = the non-linear interface for AI-assisted coding (arXiv:2604.18883), and only that**. The Software 3.0 EvoGraph and all other same-name works stay as reference/disambiguation material, not build targets.
- Promoted the focus statement in `history/evograph-ide-research.md` (header focus line, TL;DR re-tagging, new Section 2.0 "concept and vocabulary" quick reference).
- Adjusted the dossier's next-step recommendation (Section 6.7): start with Path A (non-linear interface MVP), with Path C as destination.
- Added `history/evograph-ide-execution-brief.md`: decisions to make, M0-M3 MVP plan (shadow-git checkpoint core → graph panel → compare/review → graph-as-context + merge), reusable assets, risks, first tasks.
- AGENTS.md: added a repo-focus line so future agents default to the right EvoGraph.
- bd: created the session-2 execution issue (discovered-from `evo_graph_pms-b2a`).

### Interface changes made

- None (docs only).

### What I struggled with / broke

- Nothing new this round. (Earlier session issues stand in the entry below.)

### Test status

Not applicable — no code changed.

### Handoff to next agent

- Start at `history/evograph-ide-execution-brief.md`; then read dossier Sections 2.0 (vocabulary), 2 (deep dive), and 6 (PMS angle).
- Do NOT re-research the paper — ground truth, numbers, and citations are captured in the dossier.
- Session 2's first 30 minutes: make the five decisions in the brief (build path, MVP scope, model access, checkpoint storage — recommended shadow git repo, assistant surface). Append decisions to the brief.
- Naming: do not ship publicly as "EvoGraph" (14+ collisions; dossier Section 1).

## 2026-10-24 -- EvoGraph IDE research session

### What was done

- Initialized beads in this repo (`bd init`), created and closed research issue `evo_graph_pms-b2a`.
- Ran a full web research sweep on "EvoGraph IDE": ~40 sources across Firecrawl web/paper/developer indexes, arXiv HTML full texts, citation mining from both core papers' own bibliographies, and author/lab/company verification.
- Produced `history/evograph-ide-research.md` — full dossier: disambiguation of 14 same-name "EvoGraph" works, deep dives on the two relevant papers, related-work maps, 2025–26 tooling landscape, PMS feasibility analysis with three build paths, resource index, verification notes.
- Key findings: EvoGraph IDE = McGill/Polytechnique Montreal VS Code extension research prototype (arXiv:2604.18883, April 2026) validated by a 20-participant within-subjects study; no public code. EvoGraph "Software 3.0" = AutoHand AI framework (arXiv:2508.05199) whose typed artefact graph includes ticket nodes (Jira/GitHub Issues) but defines no ticket mutation operator; unrefereed preprint, no artifacts. PMS feasibility: greenfield but plausible; key gaps = multi-user graph semantics, ticket operators, objective evaluation.

### Interface changes made

- None (documentation only; no code exists in this repo yet).

### What I struggled with / broke

- `firecrawl_research_related_papers` returned empty results on the first call because the required `intent` parameter was missing; a retry with `intent` still returned empty for these arXiv IDs (tool limitation). Worked around by mining the papers' reference lists.
- Hit the Firecrawl scrape rate limit (~11 req/min) twice; minor pages (EvoGraphCoder PDF, RedAmon docs, CMU demo PDF, IJMRD article) were only partially fetched — documented in the dossier's Section 8.
- Semantic Scholar API returned HTTP 429 (citation counts unavailable).
- Naming hazard confirmed: two relevant EvoGraph papers plus ~12 unrelated same-name works; always qualify which EvoGraph is meant.

### Test status

Not applicable — research session, no code changed.

### Handoff to next agent

- Read `history/evograph-ide-research.md` first; Sections 0 (TL;DR), 6 (PMS feasibility), and 7 (resource index) are the decision-relevant parts.
- Open decision for the user: choose build Path A (IDE-first), B (PMS-first), or C (hybrid) from Section 6.3; recommended MVP = Path B (single-repo ticket graph + checkpoint provenance + agent-run attachment).
- No code/artifacts exist for either core paper (verified 2026-10-24); Path A requires reimplementation from the paper.
- bd issue `evo_graph_pms-b2a` closed with the dossier as the deliverable.
