# Journal

## 2026-10-24 (cont. 10) -- M2 assistant loop: built, reviewed to `fix`, documented; dogfood pending

### What was done

- Built the M2 assistant loop end to end: checkpoint schema v2 (provider/model on AI checkpoints, v1 stores still readable), per-node conversation sidecars (`.evograph/chat/`, ancestor-walk restore), an OpenAI-compatible provider (configurable base URL/model, key in SecretStorage, typed request errors), a fenced-block parser with `file:` tags and path validation, and the assistant panel (view above the Checkpoint File) with send / apply / branch flows.
- Engine: `sendPrompt` (history via the ancestor walk, so a follow-up from an applied node continues the conversation), `applyCodeBlock` (workspace-traversal guard, auto-save first, applied node follows the active line), `getConversation` returning `{ sourceId, messages }`.
- Extracted the shared sheet base to `media/sheet.css`; the M1 sheet re-renders **pixel-identically** to the shipped capture (`compare -metric AE` = 0) after the extraction.
- Evidence: 14 captures (4 renditions, 320/420/560, all states) in `.impeccable/review/m2-*.png`, produced with a new exact-size frame harness (`extension/preview/frame.html` + `assistant.html`).
- Finish review (fresh subagent, degraded procedure): round 1 `recapture` (a 560px capture was really a clipped 500px one), round 2 `fix` (5 material findings), verdict pass scored fixes 2-5 **resolved**, no regressions; the only open item was the DESIGN.md record, which the user approved (A-E) and the documenter wrote.
- Documentation: `DESIGN.md` (321 → 429 lines, 15 named rules: monospace-for-code, the prose content tier, the button family, the new Printed Measure Rule) and `.impeccable/design.json` reconciled (M1 knockout-plate drift repaired).

### Interface changes made

- `CheckpointMeta` gained optional `provider`/`model` (schema v2; `SCHEMA_VERSION = 2`).
- `CheckpointEngine.getConversation(nodeId)` now returns `{ sourceId: string | null, messages: ChatMessage[] }` (was `ChatMessage[]`).
- `ApplyCodeBlockInput.provider`/`.model` are optional (the applied node records the source reply's provenance when known).
- New: `AssistantViewProvider`, `ConversationStore`, `parseContent`/`isUsableFilePath`, `AssistantProvider`/`OpenAICompatibleProvider`/`AssistantRequestError`, `createNonce`; `registerCommands(context, engine, refresh)` (dropped the statusBar parameter).
- `package.json`: `evograph.assistant` view, `evograph.setAssistantApiKey` command, `evograph.assistant.baseUrl`/`.model` settings.

### What I struggled with / broke

- Capture harness bugs, all caught before shipping: a script in `frame.html`'s `<head>` ran before `body` existed; an `id()` helper was scoped inside the wrong IIFE; a cached iframe served the pre-fix harness (cache-buster now); and the headless browser clamped a 560px capture to its ~500px window, which the reviewer correctly returned as `recapture`. Guardrail added to AGENTS.md.
- The reviewer flagged a genuine production risk the Firefox previews hid: the action and field relied on the browser's default border radius, and VS Code's webview is Chromium (rounded UA default). Added explicit `border-radius: 0`; re-verified AE=0 against both the shipped M1 capture and the reviewed M2 capture.
- Pre-existing M1 drift left unrepaired by design (documenter's call): `.state-action`'s token fallbacks disagree with the recorded day-rendition literals — filed as a bd chore.

### Test status

```
npm run check (extension/) — lint, typecheck, vitest, compile all green
Test Files  6 passed (6)
     Tests  64 passed (64)
```

### Handoff to next agent

- M2 is code-complete, reviewed (`fix` → fixes resolved, no regressions) and documented; **dogfood is the remaining gate** before closing `evo_graph_pms-0zj`. Steps: reload the dev host (recompile already done by `npm run check`), run `EvoGraph: Set Assistant API Key…`, send a prompt, Apply a `file:`-tagged block, then branch by editing an earlier prompt after switching to its checkpoint.
- Open thread: the DESIGN.md amendment for message prose is recorded as approved by the user this session (A-E); no further approval is needed for those wordings.
- Local commits are ahead of `origin/main`; push only with the user's explicit permission.

## 2026-10-24 (cont. 9) -- Dogfood fix confirmed live; M1 pushed

### What was done

- User confirmed the label-plate fix in the live Extension Development Host ("that's much better") — first post-fix dogfood validation.
- Pushed 8 local commits (M0-close, the M1 milestone, the dogfood fix + design record) to `origin/main`; `bd dolt push` synced the beads data.

### Interface changes made

- None.

### What I struggled with / broke

- Nothing.

### Test status

Not applicable — no code changed since the green gate; push only.

### Handoff to next agent

- M1 is done end-to-end: shipped, reviewed, documented, dogfood-validated, pushed.
- M2 (`evo_graph_pms-0zj`) is ready: the assistant loop (minimal chat panel, AI prompt/applied checkpoint capture, pluggable model provider — provider choice still open). It extends the established sheet world via `DESIGN.md` rather than establishing a new one.
- The user has research insights to share that may affect M2-M4 priorities — capture them before starting M2.

## 2026-10-24 (cont. 8) -- First live dogfood: label-knockout fix + verified live store

### What was done

- Recovered the working tree (see cont. 7), relaunched the dev host, and the user ran the first real dogfood session: 8 checkpoints with two diverging branches, an "Auto-save before switching" node (the passive safety flow fired for real), visited tracking and active-ref movement — all verified from the CLI against `.evograph/store.git`.
- User-reported UX defect: branch lines rendered through station labels in topologies where a spine node sits between the fork and its sibling. Reproduced in the preview harness (default model topology updated: login created before auth-flow), fixed with label knockout plates (ground-coloured rect behind each two-line label block, drawn first in the station group under the flood/hover tints; `graph.js` + `.plate` in `view.css`).
- Finish reviewer (continuation) confirmed the fix: knockout geometry exact, flood/hover uniformity intact, no regressions, ship stands over the change; evidence `fix-before-login-collision.png` / `fix-after-login-collision.png` plus the regenerated 23-file evidence set.
- Documenter (continuation) reconciled the record: `DESIGN.md` gained "The Knockout Plate Rule" (14 rules now), the station vocabulary gained the label-plate bullet, the Two-Pixel Rule now enumerates its third 2px use; the sidecar mirrored. The two previously flagged items (`.station.switching` wiring, HC-light harness path) are resolved by the same fix session; the state-action button face remains deliberately sheet-side.

### Interface changes made

- Label plates (`.plate`) in the station group; preview model's default topology changed to the collision-inducing shape (regression guard).

### What I struggled with / broke

- The collision escaped the harness because its default model did not exercise the topology; the live user hit it immediately. The fix was to make the failure topology the default model, not a special-case state.

### Test status

```
npm run check (extension/): lint (src, test, media) clean; typecheck clean; vitest 30/30; compile clean.
Finish reviewer: ship stands over the label-plate fix (targeted confirmation).
```

### Handoff to next agent

- Dogfood continues (switch-back, delete-with-reattach, theme flip); findings become bd issues (`discovered-from:evo_graph_pms-mnd`).
- The label-plate fix + design-record update are committed locally; push pending user permission together with the M1 release commits.

## 2026-10-24 (cont. 7) -- Working-tree revert incident during M1 dogfood launch (recovered)

### What was done

- Launched the Extension Development Host for M1 dogfood (`code --extensionDevelopmentPath=extension <repo>`). The user could not find the EvoGraph container.
- Diagnosed from logs: at 18:24 (after the M1 commits) the working tree had been reverted to the pre-M1 state — tracked files modified by the M1 commits were restored to their 9010afb content and every file added by those commits (media/, preview/, historyView.ts, errors.ts, .impeccable/** including DESIGN.md's sidecar and the review evidence) was deleted from disk. Untracked user files (m1_test.md, etst.txt) survived. No destructive reset appears in the reflog, so the operation did not move HEAD (a checkout/discard-style revert outside this session is the likely cause — possibly another tool or session).
- Impact: the dev host had loaded the stale (M0) extension — no `viewsContainers` in the manifest (hence no panel) and the palette activated `onCommand:evograph.restoreCheckpoint` (the old id).
- Recovery: `git reset --hard HEAD` (HEAD = b1b6a29, the M1 milestone commit — all M1 files are committed, so nothing was lost), `npm run compile`, full `npm run check` green (30/30), media/ + .impeccable/review (21 files) + the M1 manifest verified back in place.
- Guardrail added to AGENTS.md: dev-host preflight — the Extension Development Host loads the working tree, not commits; confirm `git status` is clean and run `npm run compile` before launching; a missing container + old command ids are the symptom of a stale tree.

### Interface changes made

- None (recovery only).

### What I struggled with / broke

- Nothing broken by this session's actions; the revert's origin is unexplained (not in the reflog). Watch for recurrence; if it happens again, check other running sessions/tools first.

### Test status

```
npm run check (extension/): lint clean; typecheck clean; vitest 30/30; compile clean (post-recovery).
```

### Handoff to next agent

- Dogfood continues: reload the dev host window (Developer: Reload Window) so it re-scans the restored extension, then run the M1 checklist (panel via palette "EvoGraph: Open Checkpoint File" or the secondary sidebar).
- Before any future dev-host launch: `git status` clean + `npm run compile` (see AGENTS.md preflight rule).

## 2026-10-24 (cont. 6) -- M1 finish: ship verdict, documentation, and the wiring catch

### What was done

- Ran the full impeccable finish flow for the M1 panel: evidence round (21 captures across dark/light/HC/HC-light, narrow/wide, graph/empty/error/focus/switching/menu/hover/post-switch), mechanical detector (clean), and a fresh finish-reviewer subagent over five rounds (degraded reviewer procedure): initial `fix` (8 material fixes) -> `fix` (3 regressions introduced by that batch) -> `fix` (day olive, 320 coherence, amber proof) -> `fix` (day amber contrast) -> **ship**, then a post-ship confirmation that the ship stands over the final build.
- Fixes landed across the cycle: bundled Roboto Condensed (Apache-2.0, license + notice in `extension/media/fonts/`); fixed type scale with visible-width ellipsis; road-under-thread (7px links vs 4.5px course); links reaching tick marks; switching state; focus restoration after re-render; hover state; per-theme contrast tokens (`--purple-ink`, `--olive`, `--amber`); viewport-aware sheet width; shell capped with the sheet.
- **Critical catch (post-ship, by the documenter):** `requestSwitch` was called from every interaction handler but never defined — the shipped click-to-switch path would have thrown `ReferenceError`; the harness's forced states had masked it. Fixed in `graph.js`; prevention: `npm run lint` now lints `media/**/*.js` with `no-undef` (an undefined call now fails `npm run check`).
- Documentation pass (documenter subagent, degraded procedure): `DESIGN.md` (token-bearing frontmatter + eight canonical sections, "The Interchange Sheet", 13 named rules) and `.impeccable/design.json` (schemaVersion 2, 9 component snippets, narrative). Verified independently (frontmatter tokens, section order, sidecar parse).
- Evidence: `.impeccable/review/` (21 files, hash-distinct, captured against the final build); `npm run check` green including the new media lint gate (30/30 tests).

### Interface changes made

- Webview panel ("Checkpoint File") in the VS Code secondary sidebar; renderer vocabulary (stations / control rings / ticks / ghost dashes / flood / course thread); interaction wiring (`requestSwitch`) with dim + aria-busy pending state; `historyView.ts` refresh-on-error; lint scope extended to `media/`.

### What I struggled with / broke

- Parallel edit/capture races twice (harness edits landing mid-capture) — lesson: never run the capture loop in the same tool batch as a harness edit.
- The undefined `requestSwitch` shipped through four reviewer rounds: static review and forced harness states both miss interactivity. The documenter's defect scan caught it; the media lint gate now guards that class.
- The review cycle ran five rounds chasing small regressions my own fixes introduced (contrast tokens, viewport coherence); each round was validated with live DOM probes plus pixel evidence.

### Test status

```
npm run check (extension/): lint (src, test, media) clean; typecheck clean; vitest 30/30; compile clean.
Design detector: no findings. Finish reviewer: ship (scope: the scored fixes, the rewiring fix + gate, HC-light renditions).
```

### Handoff to next agent

- M1 is complete and shipped: implementation, finish review (`ship`), documentation (`DESIGN.md` + `.impeccable/design.json`), evidence in `.impeccable/review/`.
- Next: **dogfood** — open `extension/` in VS Code, press F5, use the "Checkpoint File" view in the secondary sidebar; run the 15-minute branching scenario end-to-end (switch by click, delete with reattach, theme switch). Friction findings become new bd issues (`discovered-from:evo_graph_pms-mnd`).
- The live host round-trip (message -> safety checkpoint -> restore -> re-render) was NOT exercised in a real VS Code session by the review — it is the first thing dogfood should verify.
- After dogfood: M2 (assistant loop, bd `evo_graph_pms-0zj`) is unblocked; keep the documented "route grammar" intact (true 45° fork, numbered control rings, flooded active station, ghost dashes, one-frame redraw).
- Push pending user permission (`git push` + `bd dolt push` were NOT run).

## 2026-10-24 (cont. 5) -- M1 build: graph panel (The Interchange Sheet) implemented

### What was done

- Locked the visual direction via the impeccable decision page: **The Interchange Sheet** (transit wayfinding x orienteering; re-roll round 1, assigned index 4; seed:80703b4f4a3833dc). The chosen first-viewport sketch is the composition contract: `.impeccable/mocks/decision/assigned.html`.
- Shape brief confirmed by the user; direction contract written to `.impeccable/surfaces/extension.md` (six blocks + seed + verbatim FINISH).
- Implemented M1 in `extension/`: secondary-sidebar webview view (`viewsContainers.secondarySidebar`, VS Code >= 1.106; engines floor bumped, `@types/vscode@1.106.0`), `HistoryViewProvider` (nonce CSP, message protocol), SVG renderer (`media/graph.js`, `media/view.css`): lane layout with 45-degree branch forks, course thread + numbered control rings on the spine, ghost dashes for abandoned visited legs, junction halos, active row flood + strong ring, day/night/high-contrast renditions, keyboard-focusable stations, context menu (switch/delete), empty/error states, one-inversion flash on active change (reduced-motion safe).
- Engine: `switchToCheckpoint` (auto-save safety checkpoint when dirty; skips the file rewrite when clean), `deleteCheckpoint` (children reattach; active moves to parent; origin protected), visited tracking via `.evograph/state.json`, `getGraphModel`, storage primitives (`getTreeOid`, `removeCheckpointRef`, state read/write). The command "Switch to Checkpoint…" replaces the modal restore flow.
- Preview harness `extension/preview/index.html` (stub API + sample model) for headless renders.
- Evidence captured into `.impeccable/review/` (night/day/high-contrast, empty/error/focus, 320/560 widths, branch crops); mechanical detector run: clean. Finish reviewer spawned (fresh subagent executing the degraded finish-reviewer procedure).

### Interface changes made

- New: `CheckpointEngine.switchToCheckpoint`, `deleteCheckpoint`, `getGraphModel`; `ShadowGitStore.getTreeOid/removeCheckpointRef/readState/writeState`; `HistoryViewProvider`; command id `evograph.restoreCheckpoint` -> `evograph.switchCheckpoint` (plus `evograph.openGraph`); manifest gains `viewsContainers.secondarySidebar` + `views`; engines/type floor 1.106.

### What I struggled with / broke

- Headless screenshot race: the first capture round fired before the harness dispatched its model (all frames identical, ~3.3KB). Fixed by dispatching synchronously after graph.js loads, and surfacing harness errors onto the page.
- An edit to the harness briefly left a double-dispatch + undefined model reference; rewrote the file cleanly.
- Ghost dashes blended into the blue branch link; fixed by offsetting the ghost 5px parallel (`translate(-5 0)`).
- Long titles clipped at the fixed SVG viewBox; fixed by measuring rendered text bounding boxes after render and updating the viewBox (and hit/flood widths) accordingly.
- The focus-state screenshot does not show the ring in the CLI capture pipeline (programmatic focus); the ring was verified live via DOM (`:focus-visible` matches; ring rgb(55,148,255) at 2px). Not a build defect.

### Test status

```
npm run check (extension/): lint clean; typecheck clean; vitest 30/30 passed; compile clean.
Mechanical design detector (extension/media, extension/preview): no findings.
```

### Handoff to next agent

- Finish-review verdict pending (subagent `ses_e91ba62b8ffe9LuV6bH6qM9sHN`). After the disposition: fixes if any, then the documenter pass (DESIGN.md + `.impeccable/design.json` are required — this is a new world), then commit + push ask, then dogfood M1 (F5; the panel is in the secondary sidebar).
- If iterating on the panel visuals: keep the tokens in `media/view.css` and the direction contract; the preview harness is the fast loop.

## 2026-10-24 (cont. 4) -- M0 dogfood passed; M0 closed

### What was done

- User dogfooded M0 in the Extension Development Host (open `extension/`, F5, repo as workspace): the checkpoint create/restore/branch scenario ran end-to-end and passed as far as tested. User is still learning the flow; no friction items filed yet.
- Closed bd `evo_graph_pms-ldj` (M0) with a reason; `evo_graph_pms-mnd` (M1 graph panel) is now unblocked.

### Interface changes made

- None (bookkeeping only).

### What I struggled with / broke

- Nothing.

### Test status

Not applicable — no code changed (dogfood was behavioral; the unit gate stayed green from the scaffold commit).

### Handoff to next agent

- M1 (`evo_graph_pms-mnd`) is next: the development history graph panel (webview DAG). Start with the impeccable shape flow for the surface, then build — the first UI work establishes the design system (no `DESIGN.md` yet; `PRODUCT.md` exists).
- Open decision at M1 start: webview stack (plain TS vs framework); see mini-spec Sections 5.2 and 8.

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
