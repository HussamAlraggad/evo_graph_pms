# Thesis — Experimental Task Protocol (archived 2026-10-24)

- Source: user's thesis-companion conversation (external AI), 2026-10-24. Content preserved; decorative formatting normalized.
- Status: study prep — not yet executed. The repo's current state covers M1; the protocol's treatment condition requires M2 (assistant loop) and M3 (compare + Review Mode) plus local telemetry before the study can run.
- Relationship to this repo: `evo_graph_pms` is the thesis prototype; this protocol defines the empirical evaluation. Related: dossier Section 6.5 (validation plan), brief Section 8 (milestones).

## 1. Objective

To empirically measure whether non-linear visual branching (evo_graph_pms) reduces extraneous cognitive load (NASA-TLX), closes the Explainability Gap (E_gap), and improves Hallucination Trap Detection (M_HT) compared to standard linear AI chat.

## 2. Study design and conditions

- Participants: software engineering peers / developers (e.g., 42 Amman students).
- Task duration: 45 minutes.
- Standardized task: refactor a stateful front-end component (e.g., a complex data table with filtering, pagination, and persistent state) while implementing a new feature under changing requirements.
- Groups:
  - Control: VS Code + standard linear AI chat sidebar.
  - Treatment: VS Code + evo_graph_pms (M1 visual graph branching and M3 review mode).

## 3. Step-by-step task execution flow

1. Phase 1: Plan and branching (10 min).
   - Participants review the AI's proposed architecture for the feature.
   - Control: iterates sequentially in linear chat.
   - Treatment: uses the visual graph to test parallel approaches without destroying the baseline code.
2. Phase 2: Build and steering (25 min).
   - Participants execute code changes with AI assistance.
   - Control: accepts code edits line-by-line in the editor.
   - Treatment: conducts on-the-spot verification using diff review nodes before committing checkpoints.
   - Seeded trap: a subtle state-mutation bug or unhandled edge case is deliberately introduced by the AI prompt to test developer vigilance.
3. Phase 3: Post-task evaluation (10 min).
   - NASA-TLX survey: participants rate mental demand, frustration, and effort on a 1-100 scale.
   - E_gap comprehension test: a 5-question code comprehension quiz given without AI assistance to test whether the participant understands the state flow they just built.

## 4. Primary metrics

| Metric | Measurement method | Hypothesis |
|---|---|---|
| Cognitive load | NASA-TLX score (0-100) | Significantly lower mental demand and frustration. |
| Explainability Gap (E_gap) | Quiz accuracy on codebase logic | Significantly higher understanding (narrower gap). |
| Hallucination Trap (M_HT) | Detection time and fix rate of the seeded bug | Faster detection during diff reviews. |
| Telemetry | Extension-local logs (branches, restores, diff-view time) | High utilization of visual restore and compare features. |

## 5. Notes and open study-design questions (maintained in this repo)

- The treatment condition needs M2 + M3 + local telemetry; only M1 exists today. A Phase-1-only pilot (branch/restore interaction) can run against M1 as-is.
- The control condition should be pinned explicitly (which linear assistant, which model, which version).
- Reproducibility: ai_prompt checkpoints should record provider + model + version so the study run is reproducible; model should be pinned for the study.
- Study material (benchmark task repo, seeded trap, NASA-TLX instrument, E_gap quiz) is authored separately and stays out of the product code.
- Tracking: bd issues `evo_graph_pms-<telemetry>`, `evo_graph_pms-<study-material>` (see `bd list`).
