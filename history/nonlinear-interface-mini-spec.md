# Mini-spec — Non-linear interface core (M0)

- Status: M0 implemented as a scaffold in `extension/` (2026-10-24).
- Scope: node/edge model, shadow-git storage layout, UI states, confirm flow, M0 acceptance.
- Sources of truth: `history/evograph-ide-research.md` (paper ground truth), `history/evograph-ide-execution-brief.md` Section 8 (ratified decisions, non-goals).
- Working title: "EvoGraph" is a placeholder only — do not ship publicly under that name (dossier Section 1).

---

## 1. Purpose, decisions, and milestone map

The product is the fusion of the PMS idea and the EvoGraph IDE interaction model: **one development graph as the system of record; the IDE is the authoring surface; the board is a projection of the same graph.** Passivity is the contract: the system records work without asking, derives links and statuses from evidence, and only ever offers confirmations — never forms.

Ratified decisions (brief Section 8): IDE-core-first; solo-developer v1; passive-first with optional one-keystroke confirms; shadow-git storage; pluggable model provider (heuristic default in M0); own minimal assistant panel; read-only board last.

Milestones: M0 checkpoint core (this spec's implementation surface) → M1 graph panel → M2 assistant loop → M3 compare + Review Mode + task linking → M4 graph-as-context + merge → M5 manager web view.

V1 non-goals live in brief Section 8; the most load-bearing ones for this spec: no microservices, no IntelliJ, no multi-user merge semantics, no graph database, no OS-level deep-work features, and `#102`-style parsing is an import channel, not the core.

## 2. Vocabulary (mirrors the paper; use these exact terms)

| Term | Meaning in this product |
|---|---|
| Checkpoint | Snapshot of AI-assisted development at a point in time: codebase state + (later) AI interaction state |
| Origin | The immutable root checkpoint of a workspace store; "everything since origin" is the review scope |
| Manual change checkpoint | Created by the user (command or graph panel button) |
| AI prompt checkpoint | Auto-created on each prompt/response (M2); editing an earlier prompt branches from it |
| AI code applied checkpoint | Auto-created when the user applies an AI-suggested code block (M2) |
| Active checkpoint | The single node the workspace currently reflects |
| Branch | New child of a node that already has a child; nothing is overwritten |
| Compare with active | Temporary diff of code + interaction states between two checkpoints (M3) |
| Merge with active | New checkpoint combining two; LLM-assisted code merge from MRCA diffs (M4) |
| Graph-as-context | Toggle that includes the branching history in the next prompt (M4) |
| Review Mode | Inline provenance annotations; green = human, blue = AI (M3) |
| Responsible node | The checkpoint credited for a code region (file, description, type, timestamp, id) (M3) |
| Unattributed backlog | Checkpoints not yet linked to a task; visible, dismissible, never required (M3) |

## 3. Node and edge model

### 3.1 Nodes

| Node kind | Status | Key fields | Notes |
|---|---|---|---|
| `origin` | Implemented (M0) | meta | Exactly one per workspace store; created lazily with the first checkpoint |
| `manual` | Implemented (M0) | meta | User-created via command (M0) or graph panel (M1) |
| `ai_prompt` | Schema-ready, producer in M2 | meta + reserved | Created per AI exchange; branch on edit of earlier prompt |
| `ai_applied` | Schema-ready, producer in M2 | meta + reserved | Created on "Apply Changes" |
| `task` | Reserved (M3/M5) | task fields + meta | Tasks are graph nodes; boards are projections over them |
| `agent_run` | Reserved (post-M5) | meta + run fields | External agent sessions (Claude Code and similar) as first-class work events |
| `commit` | Reserved (import) | commit fields | Imported Git commits, linked by evidence; `#102` parsing feeds this channel |
| `decision` | Reserved | meta | Rationale/decision nodes; feeds richer provenance |

### 3.2 Checkpoint metadata (`CheckpointMeta`, schema version 1)

| Field | Type | Meaning |
|---|---|---|
| `schemaVersion` | number | Currently `1`; decode rejects unknown versions |
| `id` | string (UUID v4) | Stable identity of the node; survives any future commit rewrite |
| `type` | `origin` \| `manual` \| `ai_prompt` \| `ai_applied` | Node kind |
| `title` | string | Human-readable title; auto-generated in M0 (heuristic), editable later |
| `description` | string | Longer summary; auto-generated in M0 (heuristic) |
| `createdAt` | string (ISO 8601) | Creation timestamp |
| `parentId` | string \| null | Parent checkpoint UUID; `null` only for origin. Authoritative for the graph UI |
| `taskId` | string, optional | Reserved for task linking (M3). Absent is normal and valid |

Control characters are stripped from `title`/`description` on write (keeps the storage encoding safe).

### 3.3 Edges

- **Parent/child** is the only implemented edge (M0). It exists twice: in the metadata (`parentId`, authoritative for UI) and in Git (commit parent, authoritative for traversal and diffs).
- Reserved edge kinds (documented now, created later): `derived_from`, `produced_by` (task ← checkpoint), `depends_on` / `blocks` (task ↔ task), `reviewed_by`, `reverts`, `merges`, `references`.
- Retroactive links (for example linking an existing checkpoint to a task in M3) do **not** rewrite checkpoint commits. They live in a mutable annotation overlay (`.evograph/annotations.json`, introduced in M3): commit metadata records immutable creation facts; the overlay records curation. This keeps Git history immutable and node identities stable.

### 3.4 Storage mapping and the metadata-encoding decision

- One checkpoint = one commit in the shadow repo; the commit tree is the full workspace snapshot.
- Metadata is **embedded in the commit message**, after a marker line:

  ```
  <title>

  <description>

  --- evograph-meta ---
  {"schemaVersion":1,"id":"...","type":"manual","title":"...","description":"...","createdAt":"...","parentId":null}
  ```

- Decision rationale (deviates from the brief's tentative "commit notes" suggestion): embedding is atomic with commit creation (no second ref write that can fail), survives future parent rewrites automatically, and listing the whole graph costs one `git log --no-walk` call instead of a notes lookup per node. Git notes remain a viable migration target if message bloat ever matters; `schemaVersion` gates any migration.
- Every node also gets a Git ref named by its UUID: `refs/evograph/checkpoints/<uuid>` → commit OID. This keeps sibling branches reachable after new branches are created and makes UUID→OID lookup a ref read. The active node is the pointer ref `refs/evograph/active`.

## 4. Shadow-git storage layout (M0, implemented)

### 4.1 Layout

```
<workspace>/
├── .evograph/                  # local tool state; add to the project's .gitignore
│   ├── store.git/              # bare shadow repo (objects, refs, info/exclude)
│   └── scratch.index           # GIT_INDEX_FILE reused for staging and restores
└── (workspace files, snapshotted respecting ignore rules)
```

Refs inside `store.git`:

- `refs/evograph/active → <commit-oid>` — the active checkpoint.
- `refs/evograph/checkpoints/<uuid> → <commit-oid>` — one ref per checkpoint (branch-tip pinning).

Config set on the shadow repo at init: `user.name`/`user.email` (resolved from the workspace repo's Git identity, falling back to `EvoGraph Checkpoints <checkpoints@evograph.local>`), `commit.gpgsign=false`. `info/exclude` always excludes `.evograph/` and `.git/`.

### 4.2 Snapshot (checkpoint creation)

1. `read-tree <parent-oid>` (or `read-tree --empty` for the first node) with `GIT_INDEX_FILE=scratch.index` — the scratch index starts as the parent's tree, so `add` only hashes changed files.
2. `git add -A .` with `--work-tree=<workspace>` — stages the worktree exactly as the user's ignore rules describe it; deletions are staged as deletions.
3. `write-tree` → the snapshot tree.
4. Change list for the auto-title: `diff-tree -r --name-status --no-commit-id --no-renames <parent> <tree>` (initial snapshot: `ls-tree -r` against nothing).
5. `commit-tree <tree> -p <parent> --no-gpg-sign -m <message>` → commit OID.
6. `update-ref refs/evograph/checkpoints/<uuid> <oid>` then `update-ref refs/evograph/active <oid>`.

### 4.3 Restore (switch to a checkpoint)

1. `read-tree <oid>` into the scratch index (index := snapshot).
2. `checkout-index -a -f` with `--work-tree=<workspace>` — writes every snapshot file.
3. Delete files present in the worktree but not in the snapshot: `ls-files -o --exclude-standard -z`, then unlink each file (with a workspace-containment guard) and prune emptied directories. Ignored files (for example `node_modules/`) survive, matching `--exclude-standard`.
4. `update-ref refs/evograph/active <oid>`.

Restoring is allowed to the already-active checkpoint too — that is the "throw away uncheckpointed edits" path. Restore is destructive for uncheckpointed work; the command asks for modal confirmation (M0), to be revisited when the graph panel makes restore a one-click action (M1).

### 4.4 Listing

- `for-each-ref --format=... refs/evograph/checkpoints` (UUID → OID) joined with one `git log --no-walk=unsorted --format=%H%x1f%P%x1f%B%x1e <oids...>` call (message decode per node). Engine sorts by `createdAt` descending.
- A ref whose OID has no readable commit is a corrupt state and raises an explicit error — never silently skipped.

### 4.5 Constraints and deferred scale work

- Single-root workspaces only in M0 (first workspace folder wins); multi-root is deferred.
- Git is required (>= 2.30 for `--no-walk=unsorted`); the shadow repo is independent of whether the workspace itself is a Git repo.
- `git add -A` snapshot cost scales with file count (stat pass); acceptable for M0. Large binary assets are snapshotted like any file — a size guard/junk policy is future work.
- No gc policy yet: every node pins its commit via refs. Deletion/GC strategy lands with the graph panel's delete action (M1): delete the ref, rewrite children, let unreachable objects age out.
- Two VS Code windows on the same workspace are not synchronized (no cross-window locking) — deferred; single-window assumption documented.
- SHA-1 object format assumed but not hardcoded (no constant empty-tree hash is used).
- Workspace trust: the extension declares it requires a trusted workspace.

## 5. UI states

Paper conventions to preserve: checkpoint nodes are color-coded by type; the active node has a strong border; Review Mode is green = human, blue = AI. The final palette comes from the design system (impeccable init), not from this document.

### 5.1 M0 (implemented surface)

- **Status bar item**: `EvoGraph: <active title>` (truncated), tooltip with details; no store → `EvoGraph: no checkpoints`; no folder → `EvoGraph: no folder`; error → warning icon with the message in the tooltip.
- **Status menu** (status bar click): Create Checkpoint / Restore Checkpoint.
- **Create Checkpoint**: progress notification while snapshotting; success notification with the generated title; errors surface as VS Code error messages (full error also goes to the extension host log).
- **Restore Checkpoint**: quick pick (title; description = type + relative time + `· active` marker; detail = id), then a modal confirm that names the destructive consequence; progress while restoring; success notification.
- Busy state: operations are serialized by an in-extension mutex; UI shows the progress notification, not a spinner on the status bar.

### 5.2 M1 — graph panel (planned)

- States: loading, empty (with the call to create the first checkpoint), ready, error (with retry).
- Node visuals: color by type; active = strong border; hover = tooltip (title, type, time, id); selected = secondary emphasis.
- Interactions: click = switch version; context menu = activate / delete (children reattach; confirm modal names the reattachment); drag-pan, zoom; legend for node types.
- Branching renders as a DAG; parallel alternatives visibly diverge and rejoin only via merge (M4).
- The webview stack (plain TS vs a framework) is an open decision for M1; impeccable init supplies the design system and tokens.

### 5.3 M2 — assistant panel (planned)

- States: no provider configured (guidance state), idle, awaiting response, streaming response, apply-available (highlighted code block with Apply Changes), error (retry affordance, budget/token warnings).
- Creating a prompt checkpoint happens automatically on each exchange; editing an earlier prompt branches from that checkpoint — the UI must make the branch source visible.
- Applying code creates an `ai_applied` checkpoint and switches the workspace to it.

### 5.4 M3 — compare + Review Mode (planned)

- Compare: a temporary diff tab; code diff plus interaction-state diff between two checkpoints; close = discard.
- Review Mode: inline annotations for everything since origin; hover shows the responsible-node tooltip and highlights the node in the graph panel.
- Confirm flow UI: see Section 6.

### 5.5 M4 — graph-as-context + merge (planned)

- Graph-as-context toggle near the prompt input; visible token-cost estimate; the included path selection can start as "everything reachable" and be narrowed later (the paper's own open problem).
- Merge: preview of the LLM merge result; conflicts and failures fall back to an explicit message; merge creates a new checkpoint (never rewrites history).

### 5.6 M5 — manager web view (planned)

- Read-only board: lanes are derived views over task nodes; cards show derived status + evidence links (checkpoints, branches, commits).
- Task detail: exploration tree (branches tried, chosen path), provenance split (human vs AI), time-to-first-checkpoint and rework signals.
- No editing in v1; every status is evidence-derived, never hand-set.

## 6. Confirm flow (passive-first)

Principles:

1. **Derive by default.** Links and statuses come from evidence (branch names, changed paths, checkpoint clusters, commits). A missing link is normal, not an error state.
2. **Ask rarely, never block.** At most one confirmation prompt per work cluster; dismissible in one action; nothing waits on an answer.
3. **Make the backlog visible.** Unattributed checkpoints appear in an "unattributed" list in the graph panel (M3); the board shows them in a neutral lane (M5). They are not shoved into tasks they might not belong to.
4. **One keystroke to accept.** The suggestion UI offers the top 1-3 candidate tasks with a single accept affordance and a "Not now" that is sticky for that cluster.

Trigger (M3): after a cluster of unattributed checkpoints forms (for example a branch with >= 2 nodes or >= N minutes of activity), the system computes candidates from evidence — branch name similarity to past task titles, changed-path overlap with previously linked checkpoints, keyword match against task descriptions — and offers the link once. Accepting writes to the annotation overlay (Section 3.3); it does not rewrite history.

Never asked: during checkpoint creation, during restore, on every prompt, or for anything the user has dismissed for that cluster.

## 7. M0 acceptance criteria and test plan

Acceptance:

- A 15-minute coding session produces a correct branching history with zero manual Git usage: origin auto-created, manual checkpoints chained, restore returns the workspace exactly (including deletions and additions), and branching works by restoring an older checkpoint and creating a new one.
- `npm run check` in `extension/` is green: lint, typecheck, unit tests, compile.

Automated tests (vitest, real `git` against temp workspaces):

- Storage: init idempotence; snapshot parent chains; add/modify/delete capture; name-status diffs; exact restore; ignore rules honored; `.evograph/` never snapshotted; sibling branches reachable via refs; persistence across instances; null-active states.
- Metadata: encode/decode round trip; missing marker and invalid JSON raise typed errors; unsupported `schemaVersion` rejected; control characters stripped.
- Engine: first use creates origin + requested checkpoint; heuristic titles/descriptions; branch created by restore-then-checkpoint; unknown-id restore rejected; newest-first ordering; cross-instance persistence.

Manual dogfood script (paper's instrument): Weather Dashboard and Task Management Dashboard tasks from dossier Section 2.6, driven through checkpoint create/restore; record friction notes for M1.

## 8. Open decisions

| Decision | Status | Notes |
|---|---|---|
| LLM provider for titles/descriptions/merge | Open | Pluggable interface exists (`CheckpointSummarizer`); deterministic heuristic ships in M0; provider chosen at M2 |
| Webview stack for M1 graph panel | Open | Decide at M1 start with impeccable context; plain TS rendering is viable for small graphs |
| Task annotation overlay format | Open (design fixed in Section 3.3) | `.evograph/annotations.json` introduced in M3 |
| Public product name | Open | Tracked as a separate bd issue; do not ship as "EvoGraph" |
| Multi-root workspaces | Deferred | Documented constraint in Section 4.5 |
| Snapshot size guard / junk policy | Deferred | Revisit when dogfooding hits a large repo |

## 9. References

- Paper (ground truth): `history/evograph-ide-research.md` Sections 2.0 (vocabulary), 2.4 (system design), 2.6 (study), 6.4 (open gaps).
- Decisions and non-goals: `history/evograph-ide-execution-brief.md` Section 8.
- M0 code: `extension/` (storage in `src/storage/shadowGit.ts`, engine in `src/core/engine.ts`, metadata codec in `src/core/message.ts`).
