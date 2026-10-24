# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd prime` for full workflow context.

> **Architecture in one line:** Issues live in a local Dolt database
> (`.beads/dolt/`); cross-machine sync uses `bd dolt push/pull` (a
> git-compatible protocol), stored under `refs/dolt/data` on your git
> remote — separate from `refs/heads/*` where your code lives.
> `.beads/issues.jsonl` is a passive export, not the wire protocol.
>
> See [SYNC_CONCEPTS.md](https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md)
> for the one-screen overview and anti-patterns (don't treat JSONL as the
> source of truth; don't `bd import` during normal operation; don't
> reach for third-party Dolt hosting before trying the default).

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work atomically
bd close <id>         # Complete work
bd dolt push          # Push beads data to remote
```

## Non-Interactive Shell Commands

**ALWAYS use non-interactive flags** with file operations to avoid hanging on confirmation prompts.

Shell commands like `cp`, `mv`, and `rm` may be aliased to include `-i` (interactive) mode on some systems, causing the agent to hang indefinitely waiting for y/n input.

**Use these forms instead:**
```bash
# Force overwrite without prompting
cp -f source dest           # NOT: cp source dest
mv -f source dest           # NOT: mv source dest
rm -f file                  # NOT: rm file

# For recursive operations
rm -rf directory            # NOT: rm -r directory
cp -rf source dest          # NOT: cp -r source dest
```

**Other commands that may prompt:**
- `scp` - use `-o BatchMode=yes` for non-interactive
- `ssh` - use `-o BatchMode=yes` to fail instead of prompting
- `apt-get` - use `-y` flag
- `brew` - use `HOMEBREW_NO_AUTO_UPDATE=1` env var

## Research & Tooling Notes

- Repo focus: the **non-linear interface for AI-assisted coding** (EvoGraph IDE, arXiv:2604.18883). The Software 3.0 EvoGraph (arXiv:2508.05199) is adjacent reference only. Execution plan lives in `history/evograph-ide-execution-brief.md`.
- Fusion product (ratified 2026-10-24): one development graph as the system of record; IDE authoring surface first (M0-M4), read-only manager web view last (M5). Milestones, decisions, and v1 non-goals: `history/evograph-ide-execution-brief.md` Section 8. Design mini-spec: `history/nonlinear-interface-mini-spec.md`. Code: `extension/` (VS Code extension, TypeScript; `npm run check` must be green).
- UI/design layer is governed by the **impeccable** skill: `PRODUCT.md` (repo root) and `DESIGN.md` are its artifacts; run its `context`/`init` flows rather than hand-editing those files.
- Before batching tool calls, read each tool's required parameters from the catalog. Missing required args (e.g., `firecrawl_research_related_papers.intent`) can silently return empty results instead of raising errors.
- Keep Firecrawl scrape concurrency moderate (about 8 or fewer scrapes per batch); the API rate-limits at ~11 requests/min and partial failures are easy to miss inside batched `Promise.allSettled` results. Prefer search snippets over full scrapes when full text is not needed.
- "EvoGraph" is overloaded (14+ distinct works/products). Always qualify which EvoGraph is meant: the IDE plugin (arXiv:2604.18883), the Software 3.0 framework (arXiv:2508.05199), or an unrelated same-name work (see the disambiguation table in `history/evograph-ide-research.md`).

## Extension Dev Notes (`extension/`)

- Toolchain: TypeScript 6 in NodeNext mode. Keep `module`/`moduleResolution` on NodeNext (node10 resolution is deprecated and errors), keep `"types": ["node"]` in `tsconfig.json` (TS 6 no longer auto-includes node types for src-only configs), and keep the vitest config named `vitest.config.mts` (a `.ts` config is loaded as CommonJS and warns).
- `git for-each-ref` does not support `%x1f` pretty-format escapes (only `git log --format` does); use a literal tab separator when parsing ref listings.
- Quality gate: `npm run check` in `extension/` (lint → typecheck → tests → compile) must be green before committing code changes.
- Dev-host preflight: the Extension Development Host loads the **working tree**, not committed revisions. Before launching/reloading it, confirm `git status` shows no unexpected reverts and that `extension/out` is freshly compiled (`npm run compile`). Symptom of a stale tree: the palette shows old command ids (e.g. `evograph.restoreCheckpoint`) and the EvoGraph container is missing.
- Capture evidence with the frame harness (`extension/preview/frame.html`): it renders a preview document at an exact panel size in an iframe. The headless browser clamps the window to ~500px wide and to the screen height, and it can reset between calls — set the viewport immediately before each capture batch, assert `window.innerWidth`/`innerHeight` cover the frame, then crop `WxH+0+0` with ImageMagick. Add a cache-buster (`&v=N`) to the iframe `src`: Firefox otherwise serves the previous harness file and a capture silently shows the old state. Preview-only CSS emulates the platform tokens (buttons, focus, themed scrollbar); production CSS must never depend on it.

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:7510c1e2 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->
