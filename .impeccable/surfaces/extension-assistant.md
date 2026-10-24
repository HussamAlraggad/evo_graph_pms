---
version: 1
slug: "extension-assistant"
primary_target: "extension-assistant"
related_targets: []
---

# Surface brief — The Assistant Panel (`extension/src/ui/assistantView.ts`)

- Scope: M2 assistant loop — a webview view stacked above the Checkpoint File in the same EvoGraph container (secondary sidebar). Visitor mode: Operate.
- World: inherited from `DESIGN.md` and `.impeccable/surfaces/extension.md` (The Interchange Sheet). The panel speaks the sheet's two voices: condensed signage for its own chrome, the platform face for standard controls. No new direction; no durable system change without approval.
- Audience and job: the same solo developer mid-flow. This is where exploration is generated — ask, read, branch, apply — and every exchange becomes a checkpoint they can return to.
- Action and proof: send a prompt → the reply arrives → `Apply` on a file-tagged code block writes it after a confirm naming the target → an AI-applied checkpoint is created. Editing an earlier message rewinds to that checkpoint; a new send branches from it. Switching checkpoints restores the conversation together with the code. Success = the paper's loop (prompt → response → apply → branch) with zero manual bookkeeping.
- Content and states: conversation transcript (user/assistant messages; code blocks with Apply affordances). States: no key configured (guidance), idle, awaiting response, error (retry), apply confirmation. Tens of messages per conversation; replies arrive whole in M2 (no streaming).
- Constraints: OpenAI-compatible client (base URL key model from settings; key stored in SecretStorage); the system prompt tags code blocks with `file:<path>`; conversation state restored from per-node sidecars under `.evograph/chat/`; provider + model + version recorded on AI checkpoints (checkpoint schema version 2, accepting v1 stores). Out of scope: streaming, graph-as-context (M4), merging (M4), multi-block apply batches (one block per confirm in M2).
- Memorable moment: finishing a reply and realizing the whole exchange is now a node in the file — and that editing one earlier question forks the work, not the chat.
- Unresolved: streaming vs whole replies (whole in M2); conversation view of non-adjacent ancestors (M4); where an apply-conflict (file changed since reply) should surface (M3 diff preview likely owns it).
