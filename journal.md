# Journal

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
