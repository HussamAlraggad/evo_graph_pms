# Thesis — Concept Note Section 4.3: Empirical Apparatus (archived 2026-10-24)

- Source: user's thesis-companion conversation (external AI), 2026-10-24. Content preserved; decorative formatting normalized.
- Status: thesis-writing artifact. The description matches the repo's roadmap; M2-M5 are planned, not built — keep tense honest when pasting into the formal concept note (supervisors check claims against the repository).
- Repo-side notes (added here, not part of the original text): (a) the "open-source" claim needs a `LICENSE` file in the repo — filed as a bd issue; (b) the study's E_gap template (see `history/thesis-experimental-protocol.md` Section 6) introduces the M_CSR metric; (c) `history/` docs referenced by the apparatus section: `evograph-ide-research.md`, `evograph-ide-execution-brief.md`, `nonlinear-interface-mini-spec.md`, `thesis-experimental-protocol.md`.

---

## Section 4.3: Empirical Apparatus — The evo_graph_pms Prototype

To empirically evaluate human-AI orchestration and measure developer cognitive metrics, this research utilizes a custom-built, open-source IDE extension prototype: **evo_graph_pms**. The system grounds itself on the principle that a **single development graph serves as the system of record** for both AI-assisted coding and project management. While the IDE acts as the primary authoring surface, project tracking boards function as direct visual projections of the underlying development graph, eliminating manual bookkeeping.

### 1. System Architecture and Persistence

- **Shadow-Git Checkpoint Store (`.evograph/`):** Built as a TypeScript extension within VS Code (`extension/`), the system maintains an isolated `.evograph/` shadow-git store. This captures manual and origin interaction checkpoints — complete with heuristic titles, descriptions, and restore capabilities — without polluting the primary Git repository tree.
- **Non-Linear Navigation and Steering:** Extending research on non-linear AI interaction (arXiv:2604.18883), evo_graph_pms allows developers to branch, visually compare, merge, and restore parallel coding attempts, preserving working memory and preventing context destruction during AI exploration.
- **Passive Project Management (PMS):** Issue statuses and milestone progress update automatically based on real code diffs and interaction evidence, providing real-time state awareness for developers and project managers alike.

### 2. Milestone Execution Roadmap (M0-M5)

The development of the research apparatus follows a structured 6-phase milestone path:

- **M0 (Checkpoint Core):** Scaffolded VS Code extension, shadow-git persistence (`.evograph/`), manual/origin checkpoints, and restore mechanisms. [built, reviewed, dogfood-validated]
- **M1 (Graph Panel):** Interactive visual graph view for non-linear node inspection and navigation. [built, reviewed, dogfood-validated]
- **M2 (Assistant Loop):** Integrated AI agent loop capturing prompt intent and code diffs at each node. [planned]
- **M3 (Compare & Review Mode):** Side-by-side diff comparison, structured plan review mode, and explicit task-linking. [planned]
- **M4 (Graph-as-Context & Merging):** Utilizing historical node branches as contextual prompts and merging parallel code states. [planned]
- **M5 (Manager Web View):** Read-only project management dashboard projecting task completion directly from graph evidence. [planned]
