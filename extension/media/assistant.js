(function () {
  "use strict";

  const vscode = acquireVsCodeApi();
  const root = document.getElementById("root");

  let lastState = null;
  let lastActiveId = null;
  let lastMessageCount = -1;
  let pendingText = null;
  let failedText = null;
  let errorText = null;
  let errorRecovery = "retry";
  let draftText = "";

  window.addEventListener("message", (event) => {
    const message = event.data;
    if (!message || typeof message.type !== "string") return;
    if (message.type === "state") {
      renderState(message.state);
    } else if (message.type === "state-error") {
      renderStateError(String(message.message || "Unknown error"));
    } else if (message.type === "error") {
      errorText = String(message.message || "Unknown error");
      errorRecovery = message.recovery === "set-key" ? "set-key" : "retry";
      renderTranscript();
    }
  });

  vscode.postMessage({ type: "ready" });

  function esc(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function timeOf(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return date.toTimeString().slice(0, 5);
  }

  function isAwaiting() {
    return pendingText !== null && errorText === null;
  }

  function renderState(state) {
    if (!state || typeof state.kind !== "string") return;
    if (state.kind === "no-workspace") {
      renderNoWorkspace();
      return;
    }
    if (state.kind === "no-key") {
      renderNoKey(state);
      return;
    }
    lastState = state;
    pendingText = null;
    failedText = null;
    errorText = null;
    errorRecovery = "retry";
    renderTranscript();
  }

  function renderNoWorkspace() {
    lastState = null;
    root.innerHTML =
      headerHtml(null) +
      '<div class="state"><div class="state-card">' +
      '<p class="state-title">No folder open</p>' +
      '<p class="state-body">Open a folder to use the assistant.</p>' +
      "</div></div>";
  }

  function renderNoKey(state) {
    lastState = null;
    root.innerHTML =
      headerHtml(state) +
      '<div class="state"><div class="state-card">' +
      '<p class="state-title">The assistant has no key</p>' +
      '<p class="state-body">Prompts go through an OpenAI-compatible endpoint. Set a key to start; it is kept ' +
      "in VS Code's secret storage, never in settings. The endpoint and model live in settings.</p>" +
      '<button type="button" class="state-action" id="set-key">Set API key</button>' +
      "</div></div>";
    const button = document.getElementById("set-key");
    if (button) button.addEventListener("click", () => vscode.postMessage({ type: "set-key" }));
  }

  function renderStateError(message) {
    lastState = null;
    root.innerHTML =
      headerHtml(null) +
      '<div class="state"><div class="state-card">' +
      '<p class="state-title">The panel could not be read</p>' +
      '<p class="state-body">' + esc(message) + "</p>" +
      '<button type="button" class="state-action" id="state-retry">Retry</button>' +
      "</div></div>";
    const button = document.getElementById("state-retry");
    if (button) button.addEventListener("click", () => vscode.postMessage({ type: "ready" }));
  }

  function headerHtml(state) {
    let meta = "";
    let title = "";
    let ident = false;
    if (state && state.kind === "no-key") {
      meta = "no key";
      title = state.provider + " · " + state.model;
    } else if (state && state.kind === "ready") {
      meta = state.model;
      title = state.provider + " · " + state.model;
      ident = true;
    }
    return (
      "<div class=\"sheet-header\"><h1>Assistant</h1>" +
      (meta
        ? '<span class="count' + (ident ? " ident" : "") + '" title="' + esc(title) + '">' + esc(meta) + "</span>"
        : "") +
      "</div>"
    );
  }

  function carriedHtml(carried) {
    const typeClass =
      carried.type === "ai_prompt" ? "prompt" : carried.type === "ai_applied" ? "applied" : "plain";
    const time = carried.time ? " · " + carried.time : "";
    return (
      '<div class="carried"><span class="carried-tag">Carried from · ' +
      '<span class="typecode ' + typeClass + '">' + esc(carried.label) + "</span>" + esc(time) +
      '</span><span class="carried-title">' + esc(carried.title) + "</span></div>"
    );
  }

  function messageHtml(message) {
    const role = message.role === "user" ? "You" : "Assistant";
    const tag = role + (timeOf(message.createdAt) ? " · " + timeOf(message.createdAt) : "");
    return (
      '<section class="msg" data-role="' + esc(message.role) + '">' +
      '<p class="msg-tag">' + esc(tag) + "</p>" +
      '<div class="msg-body">' + partsHtml(message.parts) + "</div>" +
      "</section>"
    );
  }

  function partsHtml(parts) {
    let html = "";
    for (const part of parts) {
      if (part.kind === "prose") {
        html += '<p class="msg-prose">' + esc(part.text) + "</p>";
      } else if (part.kind === "code") {
        html += codeHtml(part);
      }
    }
    return html;
  }

  function codeHtml(part) {
    let head = "";
    if (part.file) {
      head =
        '<div class="code-head"><span class="code-label">Target</span>' +
        '<span class="code-file">' + esc(part.file) + "</span>" +
        '<button type="button" class="state-action apply" data-block="' + esc(part.blockId) + '"' +
        ' aria-label="Apply this change to ' + esc(part.file) + '">Apply</button></div>';
    }
    return (
      '<div class="code">' + head +
      '<pre class="code-body"><code>' + esc(part.code) + "</code></pre>" +
      "</div>"
    );
  }

  function pendingHtml() {
    return (
      '<section class="msg pending" data-role="user">' +
      '<p class="msg-tag">You</p>' +
      '<div class="msg-body"><p class="msg-prose">' + esc(pendingText) + "</p></div>" +
      "</section>"
    );
  }

  function awaitingHtml() {
    return '<div class="awaiting">Awaiting reply…</div>';
  }

  function errorHtml() {
    const action = errorRecovery === "set-key" ? "Set API key" : "Retry";
    return (
      '<section class="msg" data-role="error">' +
      '<p class="msg-tag">Request failed</p>' +
      '<div class="msg-body"><p class="msg-prose">' + esc(errorText) + "</p>" +
      '<button type="button" class="state-action retry" id="retry">' + action + "</button></div>" +
      "</section>"
    );
  }

  function emptyHtml() {
    return (
      '<div class="state"><div class="state-card">' +
      '<p class="state-title">No exchange yet</p>' +
      '<p class="state-body">Ask for a change or describe the problem. Every exchange becomes a checkpoint ' +
      "you can return to.</p>" +
      "</div></div>"
    );
  }

  function composerHtml(disabled) {
    return (
      '<div class="composer">' +
      '<textarea id="prompt" class="composer-input" rows="2" aria-label="Prompt" ' +
      'placeholder="Ask for a change, or describe the problem…"></textarea>' +
      '<div class="composer-foot"><span class="composer-hint">Enter sends · Shift+Enter new line</span>' +
      '<button type="button" class="state-action" id="send"' + (disabled ? " disabled" : "") + ">Send</button>" +
      "</div></div>"
    );
  }

  function renderTranscript() {
    const state = lastState;
    if (!state || state.kind !== "ready") return;

    const previous = root.querySelector(".transcript");
    const wasAtBottom =
      !previous || previous.scrollHeight - previous.scrollTop - previous.clientHeight < 24;
    const countChanged = state.messages.length !== lastMessageCount;
    const activeElement = document.activeElement;
    const refocusComposer =
      activeElement !== null && (activeElement.id === "prompt" || activeElement.id === "send");

    const parts = [headerHtml(state), '<div class="transcript" role="log"' + (isAwaiting() ? ' aria-busy="true"' : "") + ">"];
    if (state.carriedFrom) parts.push(carriedHtml(state.carriedFrom));
    for (const message of state.messages) parts.push(messageHtml(message));
    if (pendingText !== null) parts.push(pendingHtml());
    if (errorText !== null) parts.push(errorHtml());
    else if (pendingText !== null) parts.push(awaitingHtml());
    if (state.messages.length === 0 && pendingText === null) parts.push(emptyHtml());
    parts.push("</div>", composerHtml(isAwaiting()));
    root.innerHTML = parts.join("");

    wire();

    const transcript = root.querySelector(".transcript");
    if (transcript && (wasAtBottom || countChanged || pendingText !== null)) {
      transcript.scrollTop = transcript.scrollHeight;
    }
    lastMessageCount = state.messages.length;

    const textarea = document.getElementById("prompt");
    if (textarea) {
      textarea.value = draftText;
      autosize(textarea);
      if (refocusComposer) textarea.focus();
    }

    if (lastActiveId !== null && state.activeId && state.activeId !== lastActiveId) {
      document.body.classList.add("inverting");
      window.setTimeout(() => document.body.classList.remove("inverting"), 240);
    }
    lastActiveId = state.activeId || null;
  }

  function wire() {
    const textarea = document.getElementById("prompt");
    if (textarea) {
      textarea.addEventListener("input", () => {
        draftText = textarea.value;
        autosize(textarea);
      });
      textarea.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          send(textarea.value);
        }
      });
    }
    const sendButton = document.getElementById("send");
    if (sendButton && textarea) {
      sendButton.addEventListener("click", () => send(textarea.value));
    }
    const retry = document.getElementById("retry");
    if (retry) {
      retry.addEventListener("click", () => {
        if (errorRecovery === "set-key") vscode.postMessage({ type: "set-key" });
        else send(failedText || "");
      });
    }
    for (const apply of root.querySelectorAll(".apply")) {
      apply.addEventListener("click", () => {
        const blockId = apply.getAttribute("data-block");
        if (!lastState || !lastState.nodeId || !blockId) return;
        vscode.postMessage({ type: "apply", nodeId: lastState.nodeId, blockId: blockId });
      });
    }
  }

  function send(text) {
    const trimmed = String(text || "").trim();
    if (trimmed.length === 0 || isAwaiting()) return;
    draftText = "";
    pendingText = trimmed;
    failedText = trimmed;
    errorText = null;
    renderTranscript();
    vscode.postMessage({ type: "send", text: trimmed });
  }

  function autosize(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 132) + "px";
  }
})();
