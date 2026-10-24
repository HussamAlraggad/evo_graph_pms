(function () {
  "use strict";

  const vscode = acquireVsCodeApi();
  const root = document.getElementById("root");

  const LANE_STEP = 76;
  const LANE_ORIGIN = 64;
  const ROW = 84;

  let lastActiveId = null;
  let menuElement = null;
  let pendingSwitchId = null;
  let lastModel = null;
  let resizeTimer = null;

  window.addEventListener("message", (event) => {
    const message = event.data;
    if (!message || typeof message.type !== "string") return;
    if (message.type === "graph") {
      renderGraph(message.model);
    } else if (message.type === "graph-error") {
      renderError(String(message.message || "Unknown error"));
    } else if (message.type === "no-workspace") {
      renderNoWorkspace();
    }
  });

  document.addEventListener("click", (event) => {
    if (menuElement && !menuElement.contains(event.target)) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  window.addEventListener("resize", () => {
    if (!lastModel) return;
    if (resizeTimer) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => renderGraph(lastModel), 140);
  });

  vscode.postMessage({ type: "ready" });

  function laneX(lane) {
    return LANE_ORIGIN + lane * LANE_STEP;
  }

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

  function typeLabel(type) {
    if (type === "origin") return "origin";
    if (type === "ai_prompt") return "AI prompt";
    if (type === "ai_applied") return "AI applied";
    return "manual";
  }

  function typeClassOf(type) {
    if (type === "ai_prompt") return "prompt";
    if (type === "ai_applied") return "applied";
    return "plain";
  }

  function ellipsize(text, maxPixels, perChar) {
    const maxChars = Math.max(4, Math.floor(maxPixels / perChar));
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars - 1).trimEnd() + "…";
  }

  function layout(model) {
    const checkpoints = model.checkpoints;
    const byId = new Map(checkpoints.map((checkpoint) => [checkpoint.id, checkpoint]));
    const childrenOf = new Map();
    for (const checkpoint of checkpoints) {
      const key = checkpoint.parentId || "";
      if (!childrenOf.has(key)) childrenOf.set(key, []);
      childrenOf.get(key).push(checkpoint);
    }

    const spine = new Set();
    let cursor = model.activeId ? byId.get(model.activeId) : undefined;
    while (cursor) {
      spine.add(cursor.id);
      cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
    }

    const lane = new Map();
    let nextLane = 1;
    function assign(node, laneIndex) {
      lane.set(node.id, laneIndex);
      const kids = childrenOf.get(node.id) || [];
      if (kids.length === 0) return;
      let preferred = kids.find((kid) => spine.has(kid.id));
      if (!preferred) preferred = kids[0];
      for (const kid of kids) assign(kid, kid === preferred ? laneIndex : nextLane++);
    }
    for (const rootNode of childrenOf.get("") || []) assign(rootNode, 0);
    for (const checkpoint of checkpoints) {
      if (!lane.has(checkpoint.id)) assign(checkpoint, nextLane++);
    }

    const yOf = new Map();
    let y = 30;
    checkpoints.forEach((checkpoint, index) => {
      if (index > 0) {
        const previous = checkpoints[index - 1];
        const kids = childrenOf.get(previous.id) || [];
        let fanOut = 0;
        for (const kid of kids) {
          fanOut = Math.max(fanOut, Math.abs(laneX(lane.get(kid.id)) - laneX(lane.get(previous.id))));
        }
        y += ROW + Math.min(fanOut, 160);
      }
      yOf.set(checkpoint.id, y);
    });

    const maxLane = Math.max(0, ...lane.values());
    const baseWidth = Math.max(420, laneX(maxLane) + 270);
    const viewportWidth = window.innerWidth || baseWidth;
    const width = Math.min(Math.max(viewportWidth, 300), baseWidth);
    const height = y + 44;
    return { checkpoints, byId, childrenOf, spine, lane, yOf, width, height };
  }

  function linkPath(x1, y1, x2, y2, startGap, endGap) {
    const startY = y1 + startGap;
    const endY = y2 - endGap;
    if (x1 === x2) return "M " + x1 + " " + startY + " L " + x1 + " " + endY;
    const diagonal = Math.abs(x2 - x1);
    if (endY - startY <= diagonal + 8) {
      return "M " + x1 + " " + startY + " L " + x2 + " " + endY;
    }
    const forkY = startY + (endY - startY - diagonal) / 2;
    const direction = x2 > x1 ? 1 : -1;
    return (
      "M " + x1 + " " + startY +
      " L " + x1 + " " + forkY +
      " L " + (x1 + direction * diagonal) + " " + (forkY + diagonal) +
      " L " + x2 + " " + endY
    );
  }

  function renderGraph(model) {
    const checkpoints = (model && model.checkpoints) || [];
    if (checkpoints.length === 0) {
      renderEmpty();
      lastActiveId = null;
      return;
    }
    const graph = layout(model);
    const visited = new Set(model.visitedIds || []);

    const spineOrder = [];
    let walk = model.activeId ? graph.byId.get(model.activeId) : undefined;
    while (walk) {
      spineOrder.unshift(walk);
      walk = walk.parentId ? graph.byId.get(walk.parentId) : undefined;
    }
    const ringNumbers = new Map(spineOrder.map((node, index) => [node.id, index + 1]));

    let links = "";
    let ghosts = "";
    for (const checkpoint of graph.checkpoints) {
      if (!checkpoint.parentId) continue;
      const parent = graph.byId.get(checkpoint.parentId);
      if (!parent) continue;
      const path = linkPath(
        laneX(graph.lane.get(parent.id)),
        graph.yOf.get(parent.id),
        laneX(graph.lane.get(checkpoint.id)),
        graph.yOf.get(checkpoint.id),
        graph.spine.has(parent.id) ? 30 : 8,
        graph.spine.has(checkpoint.id) ? 26 : 8,
      );
      const isMain = graph.lane.get(parent.id) === 0 && graph.lane.get(checkpoint.id) === 0;
      links += '<path class="link' + (isMain ? " main" : "") + '" d="' + path + '"/>';
      if (visited.has(checkpoint.id) && !graph.spine.has(checkpoint.id)) {
        ghosts += '<path class="ghost" transform="translate(-5 0)" d="' + path + '"/>';
      }
    }

    let course = "";
    if (spineOrder.length > 1) {
      const points = spineOrder
        .map((node) => laneX(graph.lane.get(node.id)) + "," + graph.yOf.get(node.id))
        .join(" ");
      course = '<polyline class="course" points="' + points + '"/>';
    }

    let stations = "";
    for (const checkpoint of graph.checkpoints) {
      const x = laneX(graph.lane.get(checkpoint.id));
      const nodeY = graph.yOf.get(checkpoint.id);
      const isActive = checkpoint.id === model.activeId;
      const onSpine = graph.spine.has(checkpoint.id);
      const isJunction = (graph.childrenOf.get(checkpoint.id) || []).length > 1;
      const tagParts = [typeLabel(checkpoint.type), timeOf(checkpoint.createdAt)];
      if (isActive) tagParts.push("active");
      const labelSpace = graph.width - (x + 22) - 14;
      const titleText = ellipsize(checkpoint.title, labelSpace, 7);
      const tagRest = ellipsize(tagParts.slice(1).join(" · "), labelSpace, 5.2);
      const rowWidth = Math.max(160, graph.width - (x - 34) - 10);
      const flood = isActive
        ? '<rect class="flood" x="' + (x - 30) + '" y="' + (nodeY - 24) + '" width="' +
          Math.max(0, graph.width - (x - 30) - 14) + '" height="52" rx="2"/>'
        : "";
      const mark = onSpine
        ? '<circle class="ring' + (isActive ? " active" : "") + '" cx="' + x + '" cy="' + nodeY +
          '" r="' + (isActive ? 11 : isJunction ? 10 : 9) + '"/>' +
          (isJunction ? '<circle class="halo" cx="' + x + '" cy="' + nodeY + '" r="15"/>' : "") +
          '<text class="num" x="' + (x - 26) + '" y="' + (nodeY + 4) + '">' +
          ringNumbers.get(checkpoint.id) + "</text>"
        : '<line class="tick" x1="' + (x - 11) + '" y1="' + nodeY + '" x2="' + (x + 11) +
          '" y2="' + nodeY + '"/>';
      stations +=
        '<g class="station' + (isActive ? " active" : "") + '" tabindex="0" role="button" data-id="' +
        esc(checkpoint.id) + '" aria-label="' +
        esc(checkpoint.title + ", " + tagParts.join(", ")) + '">' +
        "<title>" + esc(checkpoint.title) + "</title>" +
        flood +
        '<rect class="hit" x="' + (x - 34) + '" y="' + (nodeY - 26) + '" width="' + rowWidth + '" height="56"/>' +
        mark +
        '<text class="stname" x="' + (x + 22) + '" y="' + (nodeY + 2) + '">' + esc(titleText) + "</text>" +
        '<text class="sttag' + (isActive ? " hot" : "") + '" x="' + (x + 22) + '" y="' + (nodeY + 17) + '">' +
        '<tspan class="typecode ' + typeClassOf(checkpoint.type) + '">' + esc(tagParts[0]) + "</tspan>" +
        "<tspan> · " + esc(tagRest) + "</tspan></text>" +
        '<rect class="focus-ring" x="' + (x - 34) + '" y="' + (nodeY - 26) + '" width="' + rowWidth +
        '" height="56" rx="2"/>' +
        "</g>";
    }

    const svg =
      '<svg viewBox="0 0 ' + graph.width + " " + graph.height + '" aria-label="Checkpoint file routes">' +
      '<g class="links">' + links + "</g>" +
      '<g class="ghosts">' + ghosts + "</g>" +
      course +
      '<g class="stations">' + stations + "</g>" +
      "</svg>";

    const focusedStationId =
      document.activeElement && document.activeElement.classList && document.activeElement.classList.contains("station")
        ? document.activeElement.getAttribute("data-id")
        : null;

    root.innerHTML =
      '<div class="sheet-header"><h1>Checkpoint file</h1><span class="count">' +
      graph.checkpoints.length + " record" + (graph.checkpoints.length === 1 ? "" : "s") +
      "</span></div>" +
      '<div class="sheet-canvas">' + svg + "</div>" +
      '<div class="sheet-footer"><span class="legend">' +
      '<span><svg class="key" viewBox="0 0 22 6" width="22" height="6" aria-hidden="true"><line class="course" x1="1" y1="3" x2="21" y2="3"/></svg>course</span>' +
      '<span><svg class="key" viewBox="0 0 22 6" width="22" height="6" aria-hidden="true"><line class="ghostline" x1="1" y1="3" x2="21" y2="3"/></svg>ghost</span>' +
      '<span><svg class="key" viewBox="0 0 22 6" width="22" height="6" aria-hidden="true"><line class="branchline" x1="1" y1="3" x2="21" y2="3"/></svg>branch</span>' +
      "</span><span>read down = time</span></div>";

    const svgElement = root.querySelector("svg");
    if (svgElement) {
      svgElement.style.maxWidth = graph.width + "px";
    }
    root.style.setProperty("--sheet-width", graph.width + "px");
    lastModel = model;

    for (const station of root.querySelectorAll(".station")) {
      const id = station.getAttribute("data-id");
      station.addEventListener("click", () => requestSwitch(id, station));
      station.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          requestSwitch(id, station);
        } else if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) {
          event.preventDefault();
          openMenu(station);
        }
      });
      station.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        openMenu(station);
      });
    }

    const restoreId = focusedStationId || pendingSwitchId;
    if (restoreId) {
      const element = root.querySelector('.station[data-id="' + restoreId + '"]');
      if (element) element.focus();
    }
    pendingSwitchId = null;
    root.removeAttribute("aria-busy");

    if (lastActiveId !== null && model.activeId && model.activeId !== lastActiveId) {
      document.body.classList.add("inverting");
      window.setTimeout(() => document.body.classList.remove("inverting"), 240);
    }
    lastActiveId = model.activeId || null;
  }

  function openMenu(anchor) {
    closeMenu();
    const id = anchor.getAttribute("data-id");
    if (!id) return;
    menuElement = document.createElement("div");
    menuElement.className = "context-menu";
    const actions = [
      {
        label: "Switch to this checkpoint",
        run: () => {
          const station = root.querySelector('.station[data-id="' + id + '"]');
          requestSwitch(id, station);
        },
      },
      { label: "Delete…", run: () => vscode.postMessage({ type: "delete", id: id }) },
    ];
    for (const action of actions) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = action.label;
      button.addEventListener("click", () => {
        closeMenu();
        action.run();
      });
      menuElement.appendChild(button);
    }
    document.body.appendChild(menuElement);
    const anchorRect = anchor.getBoundingClientRect();
    const menuRect = menuElement.getBoundingClientRect();
    const left = Math.max(4, Math.min(anchorRect.left, window.innerWidth - menuRect.width - 6));
    const top = Math.max(4, Math.min(anchorRect.bottom + 4, window.innerHeight - menuRect.height - 6));
    menuElement.style.left = left + "px";
    menuElement.style.top = top + "px";
    const first = menuElement.querySelector("button");
    if (first) first.focus();
  }

  function closeMenu() {
    if (menuElement) {
      menuElement.remove();
      menuElement = null;
    }
  }

  function requestSwitch(id, station) {
    if (station) station.classList.add("switching");
    pendingSwitchId = id;
    root.setAttribute("aria-busy", "true");
    vscode.postMessage({ type: "switch", id: id });
  }

  function renderEmpty() {
    root.innerHTML =
      '<div class="sheet-header"><h1>Checkpoint file</h1><span class="count">0 records</span></div>' +
      '<div class="state"><div class="state-card">' +
      '<p class="state-title">No records yet</p>' +
      '<p class="state-body">The file starts with your first checkpoint. Uncheckpointed work is snapshotted automatically when you switch.</p>' +
      '<button type="button" class="state-action" id="state-create">Create checkpoint</button>' +
      "</div></div>";
    const button = document.getElementById("state-create");
    if (button) button.addEventListener("click", () => vscode.postMessage({ type: "create" }));
  }

  function renderError(message) {
    root.innerHTML =
      '<div class="sheet-header"><h1>Checkpoint file</h1><span class="count">unreadable</span></div>' +
      '<div class="state"><div class="state-card">' +
      '<p class="state-title">The sheet could not be read</p>' +
      '<p class="state-body">' + esc(message) + "</p>" +
      '<button type="button" class="state-action" id="state-retry">Retry</button>' +
      "</div></div>";
    const button = document.getElementById("state-retry");
    if (button) button.addEventListener("click", () => vscode.postMessage({ type: "ready" }));
  }

  function renderNoWorkspace() {
    root.innerHTML =
      '<div class="sheet-header"><h1>Checkpoint file</h1></div>' +
      '<div class="state"><div class="state-card">' +
      '<p class="state-title">No folder open</p>' +
      '<p class="state-body">Open a folder to use the checkpoint file.</p>' +
      "</div></div>";
  }
})();
