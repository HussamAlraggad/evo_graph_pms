# Execution Brief — EvoGraph IDE: the non-linear interface for AI-assisted coding

- Status: ready for execution (next session). Created 2026-10-24.
- Primary source: `history/evograph-ide-research.md` — Section 2 is the deep dive, Section 2.0 is the concept/vocabulary, Section 7 is the link index.
- Focus: the non-linear interface only (arXiv:2604.18883). The "Software 3.0" EvoGraph and all other same-name works are reference material, not build targets.

---

## 1. Mission (working definition)

Build a tool where AI-assisted coding is a non-linear, graph-based experience: checkpoints of code + AI interaction co-evolve; developers branch, compare, merge, restore, and reuse the graph as context, with inline provenance (human vs AI). Long-term ambition (per repo README): a project-management system shaped by this model. Near-term: nail the non-linear interface core first; PMS features get layered on after it is validated.

## 2. Ground truth from the paper (do not re-research)

- Implementation: VS Code extension, TypeScript; two webview panels (AI Assistant, Development History) + extension host via message passing.
- Model usage: GPT-4o for chat, applying edits, checkpoint titles/descriptions, and merges. Merge input = diffs of both checkpoints vs their most recent common ancestor.
- Storage in the paper: VS Code Extension Context API (history, chat sessions, file snapshots persist across reloads). Diff preview via editor decorations + CodeLens; Review Mode via hover providers.
- Checkpoint types: manual change; AI prompt (auto on prompt/response; editing an earlier prompt branches); AI code applied (via "Apply Changes" on detected code blocks).
- Graph semantics: one active checkpoint; click restores code + assistant state; new nodes attach to previous active node; child-existing parent → new branch, never overwrite; graph-as-context toggle; delete reattaches children to parent; compare shows code + interaction-state diff; merge creates a combined checkpoint and merges chat via a summary message.
- Review Mode: highlights changes since origin — green = human, blue = AI; hover shows the "responsible node" (file, description, type, timestamp, identifier) and highlights that node in the graph.
- Evidence: 20-participant within-subjects study (tasks: Weather Dashboard, Task Management Dashboard). Results: lower cognitive load (less frustration), easier alternative exploration, better prompt/context management, easier change tracing. Themes: safe exploration, efficient iteration, GUI reverting, reflection.
- Known gaps (the invention surface): multi-user graph merge semantics; selective context inclusion (the paper only has a toggle); provenance richer than human/AI (requirements, rationale); checkpoint capture heuristics (participants forgot manual checkpoints); visual complexity; storage scale. No public code or artifacts exist.

## 3. Decisions to make first (30-minute warm-up in session 2)

| # | Decision | Options | Recommendation |
|---|----------|---------|----------------|
| 1 | Build path | A IDE-first / B PMS-first / C hybrid (dossier Section 6.3) | A now, C as destination |
| 2 | MVP scope | capture-only / capture+graph / +compare+review / +merge | capture + graph + restore (M0-M1), then M2-M3 |
| 3 | Model access | OpenAI GPT-4o (as in the paper) / pluggable provider / local model | pluggable interface, default to the current provider |
| 4 | Checkpoint storage | VS Code Extension Context API (as in the paper) / shadow git repo / hybrid | shadow git repo (`.evograph/`) — branch/compare/merge/diff semantics come nearly free from git objects; metadata via commit notes |
| 5 | Assistant surface | own minimal chat panel (as in the paper) / integrate existing assistants (Copilot, Claude Code, ...) | own minimal panel for the MVP to control the prompt/response/apply loop |

Record the session-2 choices by appending them to this file (append-only).

## 4. Recommended MVP milestones

- **M0 — Checkpoint core.** Shadow-git storage; the three checkpoint types; auto-generated titles/descriptions; restore = checkout; persistence across reloads.
- **M1 — Graph panel.** Interactive DAG webview; activate/switch; branching; checkpoint context menu (delete with child reattachment).
- **M2 — Compare + Review Mode.** Checkpoint-vs-active diff including interaction states; provenance highlighting; hover "responsible node".
- **M3 — Graph-as-context + merge v1.** Include-graph toggle; LLM merge from MRCA diffs; chat-history merge summary.
- **Deferred (post-MVP):** multi-user graphs, ticket/PMS layer, agent-run attachments, formal evaluation study.

Acceptance criteria (examples):
- M0: a 15-minute coding session produces a correct branching history with zero manual git usage.
- M1: the study's "try five alternatives, then continue down one" scenario works end-to-end.
- M2: every AI-applied change is traceable via hover to its originating checkpoint.
- Dogfood tasks: reuse the paper's Weather Dashboard and Task Management Dashboard tasks.

## 5. Reusable assets

- Vocabulary and UX model: dossier Sections 2.0 and 2.4 (checkpoint names, colors, interaction rules — mirror them).
- Study protocol for later validation (tutorials, tasks, questionnaires): paper Appendix A — https://arxiv.org/html/2604.18883v1#A
- All paper links and related work: dossier Section 7.
- Paper PDF: https://arxiv.org/pdf/2604.18883

## 6. Risks and constraints

- Reimplementation from a paper only (no code, no marketplace release) — keep M0 minimal and avoid scope creep.
- Webview/graph UI effort is significant; storage growth needs git objects + GC strategy; graph-as-context has real token cost.
- Naming: do not ship publicly as "EvoGraph" — 14+ name collisions (dossier Section 1).

## 7. First tasks for session 2 (bd-tracked)

1. Run `bd ready`; claim the execution issue.
2. Make the five decisions in Section 3; append them here.
3. Write the mini-spec: checkpoint data model (nodes/edges/metadata), shadow-git storage layout, UI states.
4. Scaffold the VS Code extension and implement the M0 capture loop against a toy repository.
5. Commit per milestone; update `journal.md` at session end.
