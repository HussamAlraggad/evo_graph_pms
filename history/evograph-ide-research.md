# EvoGraph IDE — Full Research Dossier

- Date: 2026-10-24
- Repo: `evo_graph_pms`
- Scope: full web research on "EvoGraph IDE" — research papers, published related work, helpful resources — plus feasibility analysis for building a Project Management System (PMS) inspired by it.
- Focus (clarified by user, 2026-10-24): the **EvoGraph IDE tool only — the non-linear interface for AI-assisted coding** (arXiv:2604.18883). This is the primary subject of this repo. The "Software 3.0" EvoGraph (arXiv:2508.05199) is retained as adjacent reference material; all other same-name works exist for disambiguation only.
- Method: Firecrawl web/paper/developer indexes + arXiv HTML full-text scraping + citation-harvesting from the papers' own bibliographies + author/lab/company verification. Sources checked 2026-10-24. Caveats in Section 9.

---

## 0. TL;DR

0. The idea in one sentence: replace the linear AI-coding chat with an explicit **graph of development checkpoints** (human edits, AI prompts, applied AI changes) that can be branched, compared, merged, revisited, and fed back in as context — this is what this repo calls the **non-linear interface** for AI-assisted coding.
1. "EvoGraph" is an overloaded name — at least 14 distinct works/products use it (see Section 1). Two of them surfaced during research; only the first is a build target:
   - **PRIMARY FOCUS — EvoGraph, the IDE plugin (the non-linear interface)** — *"Choose Your Own Adventure: Non-Linear AI-Assisted Programming with EvoGraph"* (arXiv:2604.18883, Apr 2026) by Vassilios Exarhakos (McGill), Jinghui Cheng (Polytechnique Montreal), Jin L.C. Guo (McGill). A VS Code extension that records AI-assisted coding as a branching "development graph" of checkpoints (prompts + code + manual changes) that developers can compare, merge, branch from, and turn into AI context. Validated with a 20-participant within-subjects study: significantly lower cognitive load, better alternative exploration, better prompt/context management, easier change tracing.
   - **EvoGraph, the self-evolving software framework** — *"EvoGraph: Hybrid Directed Graph Evolution toward Software 3.0"* (arXiv:2508.05199, Aug 2025) by Igor Costa and Christopher Baran (AutoHand AI, New Zealand). Represents an entire software estate as a typed directed graph — including **ticket nodes** ingested from Jira/GitHub Issues — and evolves it with SLM-driven mutation operators under a multi-objective fitness and a safety gate.
2. **Feasibility verdict for an EvoGraph-inspired PMS: plausible and largely greenfield.** The IDE paper explicitly leaves team collaboration ("share the graph", "review with prompt history") as future work; the Software 3.0 paper ingests tickets as nodes but defines **no ticket mutation operator** — both gaps are exactly where a PMS-shaped product could sit. Main costs/risks: neither work has public code, multi-user graph semantics are unsolved, and the Software 3.0 evidence is an unrefereed preprint with no artifacts. Details and build paths in Section 7.
3. No public implementation, marketplace extension, or repository was found for either core work as of 2026-10-24.

---

## 1. Disambiguation: everything called "EvoGraph"

| # | Name | Domain | What it is | Key ref |
|---|------|--------|------------|---------|
| 1 | **EvoGraph IDE plugin** | HCI / SE (AI-assisted programming) | VS Code extension; branching development graph of AI prompts + code checkpoints; the main target of this repo | arXiv:2604.18883 |
| 2 | **EvoGraph (HDGE / Software 3.0)** | SE / AI | Typed artefact graph (code, docs, build, tickets, ...) evolved by SLM mutation operators; "evoGraph" = its legacy-modernization SLM specialization | arXiv:2508.05199 |
| 3 | EvoGraph (KDD'18) | Data mining | Graph **upscaling** method preserving graph properties (preferential attachment) | Park & Kim, DGIST; KDD 2018 pp. 2051–2059; [ACM DL](https://dl.acm.org/doi/10.1145/3219819.3220123), [GitHub](https://github.com/chan150/EvoGraph), [KDD page](https://www.kdd.org/kdd2018/accepted-papers/view/evograph-an-effective-and-efficient-graph-upscaling-method-for-preserving-g) |
| 4 | EvoGraph (GPU) | Systems | On-the-fly efficient mining of evolving graphs on GPU (fixed-memory, incremental) | ISC High Performance 2017, [Springer chapter](https://link.springer.com/chapter/10.1007/978-3-319-58667-0_6) |
| 5 | EvoGraph (Fischer & Gall) | Software evolution analysis | Lightweight evolutionary and structural analysis of large software systems (RHDB data) — an early "software evolution graph" | WCRE 2006 (13th Working Conf. on Reverse Engineering); [IEEE 4023988](https://ieeexplore.ieee.org/document/4023988/), [ResearchGate](https://www.researchgate.net/publication/224675555_EvoGraph_A_Lightweight_Approach_to_Evolutionary_and_Structural_Analysis_of_Large_Software_Systems) |
| 6 | EvoGraphCoder | Self-adaptive SE | Evolutionary graph-reasoning framework; represents source code, tests, commits; multi-agent controller | IEEE Access 2026; K. Ramamurthy, R.K. Konduru, N. Amanmadov; [IEEE](https://ieeexplore.ieee.org/document/11488881/) |
| 7 | EvoGraph AI | SE (low-tier journal) | "An Evolutionary Graph-Based Framework for Adaptive Software Engineering" — text not retrievable; treat cautiously | [IJMRD article](https://www.ijmrd.in/index.php/imjrd/article/view/6500) |
| 8 | EvoGraph-R1 | Multimodal RAG (CVPR 2026) | Self-evolving multimodal knowledge **hypergraph** for agentic retrieval; graph as an editable workspace | arXiv:2607.12764; [GitHub](https://github.com/ninjaX2o/EvoGraph-R1), [CVPR supplemental](https://openaccess.thecvf.com/content/CVPR2026/supplemental/Lin_EvoGraph-R1_Self-Evolving_Multimodal_CVPR_2026_supplemental.pdf) |
| 9 | EvoGraph-Mem | Agent memory | Failure-aware **editable graph memory** for long-term language agents (insight nodes with positive/negative evidence) | arXiv:2608.11248 |
| 10 | EvoGraphNet | Medical ML | Deep EvoGraphNet — predicts time-dependent brain graph evolution (gGAN) | PRIME@MICCAI 2020; arXiv:2009.13217; [GitHub](https://github.com/basiralab/EvoGraphNet) |
| 11 | EvoGraph (RedAmon) | Security | "Evolutive Attack Chain Graph" — persistent graph of an AI red-team agent's exploitation progress | [RedAmon docs](https://www.redamon.org/docs/evograph-attack-chain-evolution) |
| 12 | EvoGraph (CMU demo) | Graph drawing | Course demo: optimizing graph readability with stochastic [layout] | https://users.ece.cmu.edu/~ajauhri/demos/evograph.pdf |
| 13 | EVOGRAPH (SourceForge) | Generative art | Legacy open-ended exploration of graphic space via evolutionary approach | [SourceForge](https://sourceforge.net/projects/evograph/) |
| 14 | EvoGraph (company) | Design services | Serbian Amazon A+ / e-store design agency; name collision only | [Facebook](https://www.facebook.com/EvoGraph.Design/) |

Adjacent "evo-*" graph papers worth knowing: EvoGit (decentralized code evolution via git-based multi-agent collaboration, arXiv:2506.02049), EvoDesign (editable diagram creation, arXiv:2604.09568), EvoForest (open-ended evolution of computational graphs, arXiv:2604.19761), EvoOptiGraph (weakness-driven coevolution for optimization modeling, arXiv:2606.26578), EvoX (evolutionary computation framework, arXiv:2301.12457), GigaEvo (LLM + evolution optimization framework, arXiv:2511.17592). Other GitHub repos named EvoGraph: `liu66-qing/EvoGraph` (real-time knowledge-graph evolution agent), `AnnaSuSu/EvoGraph` (KG evolution agent, Chinese), `marcoloco23/evograph` (phylogenetics similarity graphs), plus forks.

---

## 2. Core work 1 — EvoGraph IDE plugin (non-linear AI-assisted programming)

### 2.0 The non-linear interface — concept and vocabulary (execution quick reference)

**Definition**: EvoGraph replaces the single linear chat thread with an explicit, manipulable **development graph** in which AI interactions and codebase states co-evolve. Every meaningful event becomes a checkpoint node; the developer can branch, compare, merge, restore, and reuse the graph as prompt context.

Linear vs non-linear, side by side:

| | Linear interface (status quo) | Non-linear interface (EvoGraph) |
|---|---|---|
| History model | One append-only chat thread | Branching DAG of checkpoints (code + conversation states together) |
| Exploring alternatives | Manually revert code and re-prompt; earlier context lost | Branch from any checkpoint; alternatives coexist |
| Comparing options | Re-read long chats; diff by hand | One diff view comparing two checkpoints, code and interaction states together |
| Converging | Copy-paste or restart | Merge two checkpoints (LLM-assisted code merge; chat merge via summary) |
| Recovering | Scroll and hand-revert | Click a node to restore code + assistant state |
| Context | Whatever is in the chat window | Option to include the whole branching history as context |
| Provenance | Unclear which prompt produced what | Review Mode: green = human, blue = AI; hover shows the responsible checkpoint |

Vocabulary (use these exact terms in UI, specs, and code):

| Term | Meaning |
|---|---|
| Checkpoint | Snapshot of AI-assisted development at a point in time (codebase state + AI interaction state) |
| Manual change checkpoint | Created by the user via the Checkpoint button |
| AI prompt checkpoint | Auto-created on each prompt/response; editing an earlier prompt branches from it |
| AI code applied checkpoint | Auto-created when the user applies an AI-suggested code block |
| Active checkpoint | The single node the workspace currently reflects |
| Branch | New child of a node that already has a child; nothing is overwritten |
| Compare with active | Temporary diff of code + AI interaction states between two checkpoints |
| Merge with active | New checkpoint combining two; code merged by the LLM from MRCA diffs; chat merged via a summary message |
| Graph-as-context | Toggle that includes the branching history in the next prompt |
| Review Mode | Inline provenance annotations for all changes since origin |
| Responsible node | The checkpoint credited for a code region (file, description, type, timestamp, id) |

**Why it works** (from the 20-participant study): lower cognitive load (less frustration), easier exploration of alternatives, better prompt/context management, easier tracing of AI-generated changes. Qualitative themes: safe exploration, efficient iteration, GUI-based reverting, reflection on AI-generated changes.

**Still unsolved** (invention surface; see Section 6.4): multi-user graph merge semantics; which paths to include as context (the paper only has a toggle); provenance richer than human/AI (requirements, rationale, tradeoffs); checkpoint capture heuristics (participants forgot manual checkpoints); visual complexity management; snapshot-storage scale.

### 2.1 Identity and provenance

- Title: *Choose Your Own Adventure: Non-Linear AI-Assisted Programming with EvoGraph*
- Authors: Vassilios Exarhakos (McGill University, Montreal), Jinghui Cheng (Polytechnique Montreal), Jin L.C. Guo (McGill University)
- arXiv: 2604.18883v1 [cs.HC; cs.AI; cs.SE], submitted 20 Apr 2026. License CC BY-SA 4.0. 4.3 MB.
- Keywords: AI-Assisted Programming, AI-Assisted Coding, Exploratory Programming.
- Venue status: formatted as a conference paper ("Conference'26"); dblp lists it as CoRR abs/2604.18883 (preprint) as of Oct 2026. Aggregators (aminer, alphaXiv author pages) associate it with CHI 2026; that venue is **not confirmed** by dblp proceedings.
- Links: [arXiv abs](https://arxiv.org/abs/2604.18883) | [HTML full text](https://arxiv.org/html/2604.18883v1) | [PDF](https://arxiv.org/pdf/2604.18883) | [alphaXiv (community/AI overview)](https://www.alphaxiv.org/abs/2604.18883) | [dblp entry](https://dblp.org/pid/73/4155-4) | [The Moonlight review](https://www.themoonlight.io/en/review/choose-your-own-adventure-non-linear-ai-assisted-programming-with-evograph) | [ResearchGate](https://www.researchgate.net/publication/404059184_Choose_Your_Own_Adventure_Non-Linear_AI-Assisted_Programming_with_EvoGraph)
- Author pages: [Jin Guo lab (McGill Software Technology Lab)](https://www.cs.mcgill.ca/~jguo/lab.html) | [Jin Guo](https://www.cs.mcgill.ca/~jguo/) | [Jinghui Cheng publications (Polytechnique)](https://www.polymtl.ca/expertises/cheng-jinghui/publications) | [alphaXiv @jinghui-cheng](https://www.alphaxiv.org/@jinghui-cheng) | [alphaXiv @jin-l-c-guo](https://www.alphaxiv.org/@jin-l-c-guo)

### 2.2 Problem and preliminary study

- Current AI-assisted programming tools (Copilot, Cursor, Claude Code) are linear and chat-based, which mismatches the iterative, branching nature of real programming: exploring alternatives, working in parallel paths, backtracking.
- Git mitigates this somewhat, but it is "cumbersome to use and does not meet the fast-evolving pace of AI-enabled exploration."
- Preliminary interview study with 8 developers found three recurring breakdowns:
  1. No practical way to explore, compare, and converge alternative designs.
  2. Long prompting sequences that developers cannot keep track of, disrupting the AI's context window.
  3. Codebase review becomes hard when it is "a melange of changes layered by developers and the AI assistant, attributed to different prompts."

### 2.3 Design guidelines (DG1–DG3)

- DG1 — Managing alternative solutions: fine-grained, lightweight versioning integrated into the AI interaction.
- DG2 — Managing evolving prompts and context: prompts and code co-evolve; the evolution path itself becomes prompt context.
- DG3 — Tracing provenance of code: inline provenance linking each code region to the interaction that produced it (human vs AI).

### 2.4 System design (as implemented)

A VS Code extension with three main parts:

1. **Development history graph panel** next to the chat panel. Nodes = checkpoints of three types, color-coded:
   - Manual change checkpoints (user clicks "Checkpoint");
   - AI prompt checkpoints (created automatically on each prompt/response; editing an earlier prompt creates a new **branch** from that checkpoint);
   - AI code applied checkpoints (created when the user clicks "Apply Changes" on an AI-suggested code block; changes shown as diff hunks).
   - Every checkpoint gets an editable title + description auto-generated by GPT-4o (from prompt/response for prompt checkpoints; from the diff vs parent for code/manual checkpoints).
   - Exactly one checkpoint is **active** (dark border); clicking any node restores both the codebase state and the AI assistant state of that checkpoint. New checkpoints attach to the previously active checkpoint; if the parent already has a child, a new branch is formed without overwriting.
   - **Graph-as-context**: a toggle includes the whole branching history in the next prompt's context.
2. **Checkpoint manipulation** (context menu):
   - *Compare with active* → temporary diff tab showing differences in both code and AI interaction states.
   - *Merge with active* → new checkpoint; code merged by GPT-4o given both diffs vs the most recent common ancestor; chat histories merged by appending a summary of the other branch's conversation; title/description auto-combined.
   - *Delete* → children are reattached to the deleted node's parent.
   - *Switch to this version* → same as left-click activation.
3. **Review Mode** (inline provenance): highlights all changes since origin — green = human, blue = AI. Hovering a highlighted region shows a "Responsible Node" tooltip (file, description, type such as "AI suggestion", timestamp, identifier) and highlights the responsible checkpoint in the graph.

### 2.5 Implementation notes

- TypeScript VS Code extension; two webview panels (AI Assistant Panel; Development History Panel) communicating with the extension host via message passing.
- OpenAI GPT-4o used throughout: chat, code edits, checkpoint titles/descriptions, merges. Merge prompt = diffs of both checkpoints vs their most recent common ancestor.
- State persistence via VS Code Extension Context API (history, chat sessions, file snapshots survive reloads); diff preview via editor decorations + CodeLens providers; Review Mode via hover providers.
- Design process started from Figma sketches + multiple external iterations on representing branching paths and linking chat to edits.

### 2.6 User study and results

- Task-based, **within-subjects** study, 20 participants experienced in web development and AI assistants (ages 18–29; 9F/11M; 11 daily AI users; 1–10 yrs experience; remote; CA$45).
- Two counterbalanced conditions: EvoGraph vs a control tool (same chat UI without the graph).
- Two tasks (30 min each): polish a **Weather Dashboard**; polish a **Task Management Dashboard** (ironically, a task-management UI), then write a short report about the changes.
- Quantitative outcomes: EvoGraph significantly (1) reduced cognitive load, especially frustration; (2) made exploring alternatives easier; (3) facilitated prompt/context management (esp. refining prompts); (4) aided tracing of changes. An ordering effect appeared (larger contrast in the second task); authors speculate about learning/grounding/demand effects.
- Qualitative highlights: safe exploration; efficient iteration (P1 tried "five different solutions and then continue down the path of the one I want"; P13 built three parallel visualization alternatives and compared renders); GUI-based revert ("use the GUI to click [the node] and go back" — P8); recovery from compounding AI mistakes ("always just revert back to the first node" — P20); control-condition pain: scrolling long chat histories, and losing unfinished work ("remove all the ideas from three hours or four hours [of work]" — P4).
- Review Mode was used only lightly in the short sessions but was valued in principle for comprehension and critical reflection.
- Requested improvements: team collaboration (sharing graphs; reviewers seeing the prompt history behind a change — P12; team transparency — P10); less visual complexity; fewer missed manual checkpoints (P19); finer control over which paths go into context.

### 2.7 Discussion, broader implications, limitations

- **Agentic systems**: EvoGraph-style graphs could let developers inspect, rewind, and steer autonomous coding agents instead of restarting them.
- **Accountability/compliance**: provenance beyond code (requirements, rationale, tradeoffs) matters for regulated domains — cites Canada's Directive on Automated Decision-Making and the EU AI Act; links to traceability research (Guo et al. 2017; Guo et al. 2025) and accountability in code review (Alami et al. 2025).
- **Collaboration**: assistants are built around a dyadic human–AI model; the tool opens "sharing individual interaction histories... across team members" and embedding them in repositories.
- **Limitations (quoted scope)**: single web-dev domain; no evaluation of code quality/correctness; open-ended low-stakes tasks; subjective self-reported measures.

### 2.8 Artifact status

- No public repository, VSIX, or marketplace/Open VSX listing found (searched GitHub, VS Code Marketplace, Open VSX, author pages, lab pages, alphaXiv, generic web) as of 2026-10-24. Treat EvoGraph IDE as a research prototype that would need reimplementation.

### 2.9 Selected related work from the paper's own bibliography (the lineage to mine)

- Micro-versioning / exploratory programming: Variolite (Kery et al., 2017); The Story in the Notebook (Kery et al., 2018); Micro-versioning tool (Mikami et al., 2017); Managing Messes in Computational Notebooks (Head et al., 2019); Spellburst — node-based interface for exploratory creative coding with NL prompts (Angert et al., 2023).
- Prompt/context tooling: ChainForge (Arawjo et al., 2024); OnGoal — tracking/visualizing conversational goals (Coscia et al., 2025); BISCUIT — scaffolding LLM code with ephemeral UIs (Cheng et al., 2024); Multi-User Chat Assistant MUCA (Mao et al., 2024).
- Provenance/comprehension: Meta-Manager (Horvath et al., CHI 2024, doi:10.1145/3613904.3642676); Ivie (Yan et al., 2024); Trailblazer (Yan et al., 2025); Stacksplorer (Karrer et al., 2011); InterLink (Lin et al., 2025).
- Alternative exploration: IDE generating alternative design options and tracking decisions (Zamfirescu-Pereira et al., 2025); live-programming validation of AI code (Ferdowsi et al., 2024).
- AI-assisted workflow studies: Grounded Copilot (Barke et al., 2023); large-scale assistant usability survey (Liang et al., 2024); expectation vs experience (Vaithilingam et al., 2022); Speed at the cost of quality: Cursor study (He et al., 2026).
- Traceability/accountability: semantically enhanced traceability (Guo, Cheng, Cleland-Huang, 2017); NLP for requirements traceability (Guo et al., 2025); accountability in code review (Alami et al., 2025); SWE-bench (Jimenez et al., 2024).
- Also cited: semantic snapshots (Jiang, 2019) and social "forking" (Zhou et al., 2020) as richer future versioning; EU AI Act; Canada Directive on Automated Decision-Making.

### 2.10 BibTeX

```bibtex
@article{exarhakos2026evograph,
  title={Choose Your Own Adventure: Non-Linear AI-Assisted Programming with EvoGraph},
  author={Exarhakos, Vassilios and Cheng, Jinghui and Guo, Jin L. C.},
  journal={arXiv preprint arXiv:2604.18883},
  year={2026}
}
```

---

## 3. Core work 2 — EvoGraph (Hybrid Directed Graph Evolution toward Software 3.0)

### 3.1 Identity and provenance

- Title: *EvoGraph: Hybrid Directed Graph Evolution toward Software 3.0*
- Authors: Igor Costa, Christopher Baran — AutoHand AI ({igor,chris}@autohand.ai). Company: Christchurch, New Zealand, founded 2025 (Tracxn profile says unfunded; LinkedIn shows Igor Costa as CEO/founder and Baran ex-IBM/AWS with a public claim of "89.3% accuracy in code transformation with 12x efficiency").
- arXiv: 2508.05199v1 [cs.SE; cs.AI], 7 Aug 2025 (updated 8 Aug 2025). Unrefereed preprint; no code, benchmarks, or artifacts released (none found as of 2026-10-24). One internal empirical claim is self-cited as "Costa et al., in prep." ("a study of 312 modernization attempts across 89 organizations").
- Links: [arXiv abs](https://arxiv.org/abs/2508.05199) | [HTML](https://arxiv.org/html/2508.05199) | [ResearchGate](https://www.researchgate.net/publication/394397374_EvoGraph_Hybrid_Directed_Graph_Evolution_toward_Software_30) | [ADS](https://ui.adsabs.harvard.edu/abs/arXiv:2508.05199) | Coverage: [neuraltrendhub summary](https://www.neuraltrendhub.com/papers/evograph-hybrid-directed-graph-evolution-toward-software-3-0)

### 3.2 What it proposes

- Represent a whole software estate as a typed directed graph `G = (V, E)`; evolve it via learned mutation operators driven by small language models (SLMs); select survivors with a multi-objective fitness under a safety-first constraint.
- Goal formulation: maximize discounted expected utility over graph sequences, subject to `Pr[safety | G_t] >= 1 - delta` (tests, contracts, perf bounds) — a constrained stochastic optimization view.
- Claims: fixes 83% of known CVEs, COBOL→Java 93% functional equivalence, doc freshness within 2 minutes, 40% latency reduction vs top baseline, 7x feature lead-time drop, and (in the evoGraph SLM extension) 82–96% semantic equivalence across legacy languages with 90% cost reduction vs LLMs.

### 3.3 Artefact graph schema (the PMS-relevant part)

- **Node types**: `{code, doc, build, compiler, test, schema, policy, ticket, ui, log, metric, data}` — each node stores an embedding from an encoder trained on code + docs.
- **Edge types**: `calls, generates, derived_from, builds, documents, depends_on, emits_metric`, plus dynamic call edges mined from runtime traces/profilers/APM. Dynamic edges surface architectural debt static analysis misses.
- **Repository abstraction layer**: ingests Git, SVN, archives; each commit becomes a version slice; **tickets from Jira, GitHub Issues, "Path GeoTickets", CSV, or spreadsheets map to ticket nodes linked to changed paths by diff pattern mining**; build instructions (Make, Gradle, Ant, JCL) become build nodes; infra descriptors become policy nodes.
- Important honest observation: ticket nodes are **ingested and linked** (traceability), but none of the five mutation operators evolves tickets — the abstract's claim to "evolve... tickets" is not backed by an explicit ticket operator in the method. This is the clearest PMS-shaped gap in the paper.

### 3.4 Mutation operators

| Op | Name | Mechanism |
|----|------|-----------|
| WM | Weight Merge | Merge SLM weights as tensors (`W' = λ·Wa + (1-λ)·Align(Wb)`, λ ~ Beta); quality-diversity archives of merge recipes (inspired by Sakana's CycleQD) |
| CP | Code Patch | Draft SLM proposes AST edit script; Critic SLM compiles + static checks; logistic acceptance (hybrid automated program repair pattern) |
| DS | Doc Sync | Generate doc patch from code diff; freshness = ROUGE-L + embedding cosine blend; threshold acceptance |
| BW | Build Weave | Mutate build graphs (add dependency, change flags, upgrade toolchain); hermetic rebuild in Nix/container; reproducibility = share of identical hashes across m rebuilds |
| TR | Transmute | Legacy language translation: parse → IR → target skeleton via structured prompts → semantic tests generated from execution traces → iterate until pass rate ≥ threshold |

Note: TR = Transmute (translation), not "ticket". There is no ticket operator.

### 3.5 Fitness, selection, safety

- **Fitness vector** `F(G) = [U, 1 - P_norm, S, B, D, C]`: user task success, p95 latency (inverted), static security score, business KPI delta, doc freshness, build reproducibility — all normalized to [0,1]. A contextual bandit learns weights over time from post-rollout KPI rewards (simplicial projection update); priorities can shift dynamically (security incident, performance spike).
- **Selection**: Pareto archive of non-dominated solutions plus a novelty term (k-NN distance in behavior-descriptor space — node-type histogram + performance signature); probability ∝ exp(α·inv_rank + β·novelty).
- **Safety gate** `S(G)`: tests ≥ threshold AND contracts pass (interface assertions mined by SLMs, checked with SMT or runtime probes) AND p95 ≤ max AND semantic drift ≤ epsilon (drift measured on mined business rules — targets "implicit contract" failures in enterprise modernization).
- **Algorithm**: population of cloned graphs; per generation sample operators, evaluate, update bandit weights, quality-diversity select, then rollout the best only if it passes the safety gate.

### 3.6 evoGraph (SLM specialization for legacy modernization)

- Language-specific SLMs (Phi-2 2.7B, Nemotron-H 4.8B, Hymba) fine-tuned per legacy language; coordinated by a central controller that keeps safety/fitness constraints.
- SLMs deployable on-prem (sensitive codebases), faster fine-tune cycles, and parallel processing: 8 code segments in parallel on one A100 80GB vs 1–2 with larger models.
- Benchmarks: OSS Bank (50K LOC Java+SQL, 18 published CVEs), Tele Shop (90K polyglot e-commerce with traffic traces), COBOL Core (12K COBOL banking kernel + JCL), .NET Legacy (25K C#/.NET Framework), Lisp Systems (8K Common Lisp), CGI Legacy (5K Perl), ColdFusion App (15K), Legacy Python (18K, Python 2.7), C Systems (22K embedded).

### 3.7 Headline results (as reported)

| Task | Metric | Copilot | Hybrid APR | DGM | EvoGraph |
|------|--------|---------|-----------|-----|----------|
| OSS Bank CVEs fixed | /18 (higher better) | 6 | 4 | 9 | **15** |
| Tele Shop p95 latency | ms (lower better) | 420 | 395 | 330 | **250** |
| Feature lead time | hours (lower better) | 168 | 120 | 24 | **3** |
| COBOL→Java equivalence | % (higher better) | – | – | 71 | **93** |
| Doc freshness | BLEU (higher better) | 0.33 | 0.31 | 0.47 | **0.82** |

Cost table (processing 10K LOC): GPT-4-based (~1.8T) = 120 GPU-hrs / 450 kWh baseline; Llama 2 70B = 85 / 320 kWh; Mixtral 8x22B = 65 / 245 kWh; evoGraph (3–7B) = **12 GPU-hrs / 45 kWh (90% reduction)**. All main gains reported significant (paired t-test, p < 0.01).

### 3.8 Human in the loop, limitations, future work

- Autonomy sliders: teams can pin metrics, lock nodes, require approval when business-critical modules change.
- Limitations (paper-stated): memory grows with nodes/edges — >1M LOC estates need sharding; dynamic edge mining may miss low-frequency paths; translation quality drops on macro-heavy PL/I and unstructured COBOL; SLM training needs language-specific expertise/datasets.
- Future work highlights: sharded graph encoder for 10M LOC monorepos; SMT-backed contract mining; incremental semantic diffing across multi-repo supply chains; **"direct business OKR to fitness weight mapping"**; federated evolution recipes across tenants; automated SLM training pipelines; legacy monitoring integration; heterogeneous SLM+LLM agentic systems.

### 3.9 Lineage it builds on (from its own references)

- SLM position paper: "Small Language Models are the Future of Agentic AI" (NVIDIA Research, arXiv:2506.02153); Phi-3 (arXiv:2404.14219); Nemotron-H (arXiv:2504.03624); Hymba (arXiv:2411.13676).
- Code models: AlphaCode 2 (DeepMind), CodeGen (arXiv:2203.13474), Mixtral 8x22B.
- Evolutionary merging & self-improvement: CycleQD (Sakana AI, population-based model merging via QD); Darwin Godel Machine (arXiv:2505.22954); hybrid APR GIANTREPAIR (arXiv:2406.00992).
- Industry modernization: IBM watsonx Code Assistant for Z; AWS Transform for Mainframe; Microsoft Azure COBOL migration agents; MITRE legacy IT modernization guidance; LLM documentation for legacy code (arXiv:2411.14971).

### 3.10 Reception / credibility notes

- The paper is an unrefereed arXiv-only preprint from an early-stage startup; no artifacts, benchmark harness, or code were released; one key empirical input is self-cited as "in prep." Treat the reported numbers as vendor claims, not independently replicated results.
- There is early third-party uptake: a public GitHub issue ("ACIA Agent: Semi-Autonomous Software 3.0 Evolution... using the architectural principles of EvoGraph (arXiv:2508.05199)", repo `bellatrix11176/AI-Code-Integrity-Auditor`, issue #2) shows builders attempting to implement the framework; a derivative paper ("An Evolutionary Graph Intelligence Framework for Self-[Adaptive Software Engineering]", scientiamresearch.net) cites EvoGraphCoder and this line of work.

### 3.11 BibTeX

```bibtex
@article{costa2025evograph,
  title={EvoGraph: Hybrid Directed Graph Evolution toward Software 3.0},
  author={Costa, Igor and Baran, Christopher},
  journal={arXiv preprint arXiv:2508.05199},
  year={2025}
}
```

---

## 4. Broader research map (papers grouped by theme)

### 4.1 Non-linear workflows, micro-versioning, and history tooling

- Variolite (Kery et al., CHI 2017) — lightweight variant versioning in notebooks; The Story in the Notebook (Kery et al., CHI 2018); Managing Messes in Computational Notebooks (Head et al., CHI 2019); Micro-versioning tool (Mikami et al., 2017); Spellburst (Angert et al., 2023).
- EvoGraph IDE itself (Section 2) is the newest entry in this line.

### 4.2 Prompt/context management and AI-code understanding

- ChainForge (Arawjo et al., CHI 2024) — visual prompt engineering and hypothesis testing; OnGoal (Coscia et al., 2025) — goal tracking in multi-turn dialogue; BISCUIT (Cheng et al., CHI 2024); MUCA (Mao et al., 2024); Ivie (Yan et al., 2024); Trailblazer (Yan et al., 2025); Meta-Manager (Horvath et al., CHI 2024).

### 4.3 Provenance, traceability, accountability, compliance

- Semantically enhanced software traceability (Guo, Cheng, Cleland-Huang, 2017, IEEE TSE line of work); NLP for requirements traceability (Guo et al., 2025).
- Accountability in code review with LLMs (Alami et al., 2025).
- SUMMIT: scaffolding OSS issue discussion through summarization (Gilmer et al.; arXiv:2308.02780; Best Paper at its venue) — issue threads as sense-making objects.
- Trust-Aware Multi-Agent Traceability: confidence-calibrated knowledge graphs for consistent software artifact management (arXiv:2606.17203).
- Regulatory drivers: EU AI Act (Reg. 2024/1689) and Canada's Directive on Automated Decision-Making — both cited by EvoGraph IDE as motivation for process provenance.

### 4.4 Agentic / LLM software engineering and multi-agent software companies

- MetaGPT ("software company" multi-agent framework); ChatDev: Communicative Agents for Software Development (arXiv:2307.07924); AgileCoder / dynamic collaborative agents based on Agile methodology (arXiv:2406.11912); LLM-Based Multi-Agent Systems for Software Engineering: Literature Review (ACM doi:10.1145/3712003); RTADev (ACL Findings 2025).
- Cognitive Agents Powered by LLMs for Agile Software Project Management (SAFe simulation with virtual agents, arXiv:2508.16678).
- Rethinking Software Development as a Self-Adaptive Socio-Technical System (arXiv:2609.13461) — adapt the development configuration (roles, authority, verification) as context changes; the closest "PMS as a living system" framing found.
- Repository/issue agents: LingmaAgent (arXiv:2406.01422), LocAgent (arXiv:2503.09089), RANGER (arXiv:2509.25257), Code Graph Model (arXiv:2505.16901), LinkAnchor issue-to-commit recovery (arXiv:2508.12232), DepsRAG (arXiv:2405.20455), RepoDoc knowledge-graph docs (arXiv:2604.26523), GRADE agent dependency graphs (arXiv:2606.22741), AgentFlow (arXiv:2607.01640), ContextWeaver (arXiv:2604.23069), PRAXIS (arXiv:2608.19784), LIDL (arXiv:2601.05539), SkillForge (arXiv:2608.18933), Process-Centric Analysis of Agentic Software Systems (arXiv:2512.02393), Agent skill supply chains (arXiv:2607.01136).
- Issue-link reality check: prior studies find only ~42.2% of GitHub issues are correctly linked to their commits (cited by LinkAnchor) — automating ticket↔code links is an open problem and a PMS differentiator.

### 4.5 Evolutionary coding agents (the "Software 3.0" context)

- Andrej Karpathy, "Software Is Changing (Again)" (YC AI Startup School, 2025) — the Software 1.0/2.0/3.0 framing the EvoGraph paper builds on: [YouTube](https://www.youtube.com/watch?v=LCEmiRjPEtQ), [YC library](https://www.ycombinator.com/library/MW-andrej-karpathy-software-is-changing-again), [Latent Space](https://www.latent.space/p/s3).
- AlphaEvolve: a coding agent for scientific and algorithmic discovery (DeepMind, arXiv:2506.13131) — evolutionary LLM search over code; flagship of this paradigm.
- Darwin Godel Machine (arXiv:2505.22954) — self-rewriting agent loop; CycleQD (Sakana AI) — model merging via quality diversity.
- Open implementations: OpenEvolve (open-source AlphaEvolve-style franework; `github.com/codelion/openevolve`, also `github.com/algorithmicsuperintelligence/openevolve`), ShinkaEvolve (SakanaAI/shinkaevolve).
- NVIDIA SLM position paper (arXiv:2506.02153) — the theoretical base under the EvoGraph evoGraph extension.

### 4.6 Dependency graphs, planning, and classic PM theory

- DAG-Plan: generating directed acyclic dependency graphs for planning (arXiv:2406.09953) — DAG as the central representation; parallel execution made explicit.
- Design Structure Matrix (DSM): Steward (1981); Eppinger & Browning, *Design Structure Matrix Methods and Applications* (MIT Press, 2012) — the classic dependency/sequencing model for complex engineering projects ([MIT Press](https://mitpress.mit.edu/9780262300650/design-structure-matrix-methods-and-applications/), [tutorial](https://www.tysonbrowning.com/teaching/design-structure-matrix-dsm-tutorial), [Wikipedia](https://en.wikipedia.org/wiki/Design_structure_matrix)).
- Critical path analysis over DAGs in graph databases: [Neo4j DAG/critical path article](https://neo4j.com/blog/developer/dags-neo4j-critical-path-analysis/); task-graph pattern: [Berkeley pattern language](https://patterns.eecs.berkeley.edu/?page_id=609).

---

## 5. Tooling and product landscape (2025–2026)

- **Issue trackers with dependencies**: GitHub "blocked by / blocking" issue dependencies shipped Aug 21, 2025 ([changelog](https://github.blog/changelog/2025-08-21-dependencies-on-issues/), [docs](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-issue-dependencies)); Jira issue links (blocks/is blocked by); Linear dependency graphs. None of these model AI-agent work provenance or prompt history.
- **Non-linear version control**: Jujutsu (jj) — git-compatible VCS built around conflict-tolerant, stackable changes ([strategies post](https://reasonablypolymorphic.com/blog/jj-strategy/), [stacked PRs with jj](https://olivernguyen.io/w/jj.git/)); GitHub stacked PRs (changelog 2026-07-30); [jj + GitHub stacks](https://alan.norbauer.com/articles/github-stacks-with-jujutsu/).
- **Parallel agent orchestration boards** (the closest commercial analog of a "graph of agents doing work"): Vibe Kanban (kanban board over agent worktrees), Conductor, Crystal, Pane, Chloe; comparisons: [Nimbalyst 2026 comparison](https://nimbalyst.com/blog/best-agent-management-tools-2026/), [AugmentCode: 9 open-source agent orchestrators](https://www.augmentcode.com/tools/open-source-agent-orchestrators), [crystl comparison](https://crystl.dev/blog/best-ai-agent-orchestration-tools/). These track task → worktree → diff per agent, but generally lack checkpoint graphs, provenance, and dependency semantics.
- **Repo/graph tooling**: moonrepo project graph ([docs](https://moonrepo.dev/docs/how-it-works/project-graph)); Graph-It-Live VS Code extension (import/call graphs); Neo4j for DAG analysis.

---

## 6. Answers to the repo's core question: can we build a PMS out of EvoGraph?

### 6.1 Verdict

Yes — with a clear-eyed split between what the papers give you and what you must invent:

- EvoGraph IDE contributes a **validated interaction model** (development graph: checkpoints, branching, compare, merge, graph-as-context, provenance review mode) and a **study instrument** (tutorials, two tasks, questionnaires) you can reuse. It does not contribute code or multi-user semantics.
- EvoGraph HDGE contributes a **data model** (typed artefact graph with ticket nodes, typed edges, commit slices) and an operational loop (mutate → evaluate → safety-gate → rollout). It does not contribute a ticket operator, a UI, or reproducible evidence.
- Everything "project management"-specific — multi-user graphs, review flows, scheduling/dependencies, permissions, reporting — is greenfield, but adjacent research and tooling (Sections 4–5) provide building blocks.

### 6.2 Concept mapping: EvoGraph → PMS

| EvoGraph concept | PMS translation |
|---|---|
| Checkpoint (manual / AI prompt / AI applied) | Work-item state snapshot: task checkpoint with provenance (human vs AI), title/description auto-summarized |
| Branch from a checkpoint | Parallel workstream / exploration variant / experiment |
| Merge with active (code + chat merge) | Integration of parallel work with preserved rationale; AI-assisted conflict resolution |
| Active checkpoint | "Current context" — what the developer/agent is working on now |
| Graph-as-context | Project memory for agents: the work graph becomes retrievable context (cf. agent memory research: EvoGraph-Mem, ContextWeaver) |
| Review Mode (green/blue provenance, responsible node) | Audit trail: who/what/when/why for every change — maps to compliance (EU AI Act) and code review with AI history |
| Ticket node + diff-pattern-mined ticket↔path links | Issue tracker as first-class graph citizens; automatic issue-to-commit traceability (addresses the ~42% link-recovery gap) |
| Fitness vector [U, P, S, B, D, C] | Portfolio/project health metrics (lead time, latency, security, doc freshness, build reproducibility) |
| Safety gate + autonomy sliders + node locking | Definition-of-done / quality gates / governance and approval workflows |
| Pareto + novelty selection | Managing a portfolio of parallel tracks; rewarding genuinely new approaches |
| Mutation operators (CP, DS, BW, TR) | Agent jobs: code patches, doc sync, build maintenance, migrations — each with review gates |

### 6.3 Build paths

**Path A — IDE-first (reimplement EvoGraph IDE, then grow team features).**
Build a VS Code extension that snapshots workspace + chat state as a checkpoint DAG (git worktrees/commits + metadata store), offers branch/compare/merge/graph-as-context/review-mode, then add sharing, issue links, and a web board. Pros: directly follows validated design; fastest to a demo users can touch. Cons: reimplementation from a paper (no code); VS Code extension UI work is heavy; multi-user story is invented later.

**Path B — PMS-first (graph of work + agents; IDE is a client).**
Build the system of record as an artefact graph: nodes = epics/tasks/checkpoints/artifacts/prompts/agent-runs/decisions; edges = depends_on / blocked_by / produced_by / derived_from / reviewed_by. Ingest tickets (GitHub/Jira), link to code paths by diff-pattern mining, attach agent runs (worktree-isolated), expose a graph board UI (React Flow / custom). The EvoGraph IDE-style panel becomes an optional editor client. Pros: the PMS is the product; the graphs of both papers become features. Cons: requires inventing ticket mutation semantics and multi-user merge semantics; larger surface area.

**Path C — Hybrid (artefact graph as core; IDE plugin + web board as two clients).**
Treat the artefact graph (Path B) as the single source of truth; the IDE plugin (Path A) reads/writes checkpoints and provenance through an API; agent ops (Path B mutation operators + safety gates) run as services. This is the most faithful synthesis of both papers and the closest thing to "Software 3.0 project management". Highest initial complexity.

### 6.4 Gap list (things the papers do NOT solve — the invention surface)

1. **Ticket evolution**: no operator evolves or refines tickets; the SW3 abstract oversells this. A PMS could define ticket operators (triage, split, refine acceptance criteria, link evidence, close with provenance) with the same fitness/safety framing.
2. **Multi-user development graphs**: merging two developers' branching histories (not just branches within one session) is untouched; comments in the study only ask for sharing.
3. **Graph scale and identity**: SW3 admits >1M LOC needs sharding; checkpoint-level graphs add snapshot costs. Need a storage strategy (content-addressed snapshots + deltas).
4. **Evaluation beyond subjective ratings**: the IDE study does not measure output quality; SW3's evidence is unverified. Any PMS built from this should define objective metrics from day one (lead time, rework rate, revert rate, traceability coverage, review latency).
5. **Agent-work provenance**: nothing tracks which agent/session/model produced a checkpoint across agents (Claude Code, Copilot, etc.). A neutral checkpoint/attribution protocol is an open lane.
6. **Context economics**: graph-as-context is a toggle in the paper; deciding what to include (and proving it improves outcomes) is open (cf. ContextWeaver).

### 6.5 Suggested validation plan (reuse the paper's instrument)

- Port the Appendix A protocol (tutorials, Weather Dashboard + Task Management Dashboard tasks, post-task questionnaires) to compare your build against a baseline (plain chat + git), 12–20 participants, counterbalanced — this gives comparability with the published results.
- Add objective measures the original study lacked: time-to-first-working-state, number of reverts, traceability coverage (issue↔commit link correctness), review time per change, context token spend.
- For the SW3-inspired parts, do not attempt to replicate their benchmark claims; instead build small, reproducible tasks (e.g., doc-sync freshness, safe-patch gates) with public harnesses.

### 6.6 Risks and unknowns

- No code for either core work — budget for reimplementation and UI build-out.
- SW3 credibility: unrefereed, vendor-authored, no artifacts, self-cited evidence; borrow the architecture, not the numbers.
- IDE paper venue unconfirmed (preprint formatting says "Conference'26"); treat as a preprint with a strong study.
- Multi-user graph merge semantics are a genuine research problem; scope the MVP to single-team, single-repo first.
- Name overload: "EvoGraph" collisions (Section 1) will hurt discoverability — pick a distinct product name.

### 6.7 Concrete next steps (options)

1. Write the product spec choosing Path A/B/C and the MVP surface. Focus-clarified recommendation: start with **Path A (the non-linear interface MVP in a VS Code extension)** and treat Path C as the destination; the concrete M0-M3 plan and the five opening decisions live in `history/evograph-ide-execution-brief.md`.
2. Spike a VS Code extension that mirrors EvoGraph IDE's checkpoint model on top of git (recommended: shadow git repo for checkpoint storage), reusing its exact UI vocabulary (checkpoint types, colors, Review Mode).
3. Draft the checkpoint data model (nodes/edges/metadata) and shadow-git storage layout as a design doc under `history/` before writing code.

---

## 7. Resource index (all links in one place)

Core papers:
- EvoGraph IDE — https://arxiv.org/abs/2604.18883 (HTML: https://arxiv.org/html/2604.18883v1)
- EvoGraph HDGE — https://arxiv.org/abs/2508.05199 (HTML: https://arxiv.org/html/2508.05199)
- EvoGraphCoder — https://ieeexplore.ieee.org/document/11488881/ (IEEE Access 2026)
- KDD'18 EvoGraph — https://dl.acm.org/doi/10.1145/3219819.3220123; code https://github.com/chan150/EvoGraph
- Fischer & Gall EvoGraph — https://ieeexplore.ieee.org/document/4023988/
- GPU EvoGraph — https://link.springer.com/chapter/10.1007/978-3-319-58667-0_6
- EvoGraph-R1 — https://arxiv.org/abs/2607.12764; code https://github.com/ninjaX2o/EvoGraph-R1
- EvoGraph-Mem — https://arxiv.org/abs/2608.11248
- EvoGraphNet — https://arxiv.org/abs/2009.13217; code https://github.com/basiralab/EvoGraphNet
- EvoGraph AI (low-credibility) — https://www.ijmrd.in/index.php/imjrd/article/view/6500

Adjacent/searches useful pages:
- alphaXiv (IDE paper) — https://www.alphaxiv.org/abs/2604.18883
- The Moonlight review — https://www.themoonlight.io/en/review/choose-your-own-adventure-non-linear-ai-assisted-programming-with-evograph
- mlsanity summary — https://mlsanity.com/paper/2604.18883/
- dblp (Guo) — https://dblp.org/pid/73/4155-4
- McGill lab — https://www.cs.mcgill.ca/~jguo/lab.html
- AI-assisted coding awesome lists: https://github.com/saviorand/awesome-ai-assisted-coding, https://github.com/jamesmurdza/awesome-ai-devtools, https://github.com/eltociear/awesome-ai-driven-development
- Agent orchestrator comparisons — https://nimbalyst.com/blog/best-agent-management-tools-2026/, https://www.augmentcode.com/tools/open-source-agent-orchestrators
- GitHub issue dependencies — https://github.blog/changelog/2025-08-21-dependencies-on-issues/
- jj workflows — https://reasonablypolymorphic.com/blog/jj-strategy/
- OpenEvolve — https://github.com/codelion/openevolve; ShinkaEvolve — https://github.com/SakanaAI/shinkaevolve
- AlphaEvolve — https://arxiv.org/abs/2506.13131; DeepMind blog: https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/
- Karpathy Software 3.0 talk — https://www.youtube.com/watch?v=LCEmiRjPEtQ; https://www.ycombinator.com/library/MW-andrej-karpathy-software-is-changing-again
- DSM — https://mitpress.mit.edu/9780262300650/design-structure-matrix-methods-and-applications/; https://www.tysonbrowning.com/teaching/design-structure-matrix-dsm-tutorial
- Trust-aware traceability KG — https://arxiv.org/abs/2606.17203; DepsRAG — https://arxiv.org/abs/2405.20455; LinkAnchor — https://arxiv.org/abs/2508.12232; DAG-Plan — https://arxiv.org/abs/2406.09953; self-adaptive socio-technical — https://arxiv.org/abs/2609.13461; Agile PM agents — https://arxiv.org/abs/2508.16678; SUMMIT — https://arxiv.org/abs/2308.02780
- Third-party building on SW3 EvoGraph — https://github.com/bellatrix11176/AI-Code-Integrity-Auditor/issues/2

---

## 8. Verification notes and caveats

- Directly verified by full-text reading: both core papers (sections, methods, numbers, references) via arXiv HTML; seed evidence for the name-collision table via publisher pages/search results.
- Partially verified (source blocked/rate-limited): EvoGraphCoder full abstract (IEEE blocks scraping; details from indexing snippets and Google Scholar citation: IEEE Access 2026, K. Ramamurthy, R.K. Konduru, N. Amanmadov); IJMRD "EvoGraph AI" text (PDF.js viewer only); RedAmon EvoGraph page and CMU EvoGraph demo PDF (rate limit; title/snippet only); Semantic Scholar API (HTTP 429) — citation counts unavailable.
- Venue status of the IDE paper: preprint (CoRR) in dblp as of Oct 2026; "Conference'26" placeholder and CHI 2026 association in aggregators are not confirmation.
- Scarcity note: no public code/artifacts for either core work; treat all performance numbers in Section 3.7 as unverified vendor claims.
- Search index date: 2026-10-24. Some aggregator snippets may change over time.
