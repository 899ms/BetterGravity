// BetterGravity Compact Plugin
//
// Triggers on-demand compaction at any context level matching Codex / Claude Code.
// Rules:
// 1. If prompt box is empty and user types '/', 'compact' appears along with standard options.
// 2. Typing characters matching 'compact' filters to compact; non-matching characters hide it.
// 3. If prompt box already had text before '/', 'compact' is hidden and does not work.
// 4. Selecting 'compact' auto-sends immediately (no Enter required, no further typing).
// 5. Compacting prompts the model to summarize conversation history and prune redundant context.

/* ── DOM & State Tracking ────────────────────────────────────────────────── */
let hadPriorText = false;
let wasEmptyBeforeSlash = false;

function getPromptBox() {
  return document.querySelector(
    '[data-testid="agent-input-box"] [contenteditable="true"]'
  );
}

function getBoxText() {
  const box = getPromptBox();
  if (!box) return "";
  return (box.innerText || "")
    .replace(/[\u200B-\u200D\uFEFF\n\r]/g, "")
    .trim();
}

function shouldShowCompact(currentText) {
  if (hadPriorText || !wasEmptyBeforeSlash) return false;
  if (!currentText || !currentText.startsWith("/")) return false;

  const query = currentText.slice(1).trim().toLowerCase();
  if (query === "") return true;
  return "compact".startsWith(query);
}

function clearEditorState(box) {
  try {
    if (!box) return;
    const editor = box.__lexicalEditor;
    if (editor) {
      editor.update(() => {
        const root = editor._editorState?._nodeMap?.get("root");
        if (root && typeof root.getWritable === "function") {
          root.getWritable().clear();
        }
      });
    }
    box.blur();
  } catch {}
}

/* ── Compaction Execution ────────────────────────────────────────────────── */
function executeCompaction() {
  const menu = document.querySelector("[data-mention-menu]");
  if (menu) {
    try {
      menu.style.display = "none";
    } catch {}
  }

  const box = getPromptBox();
  if (box) {
    clearEditorState(box);
  }
  wasEmptyBeforeSlash = false;
  hadPriorText = false;

  try {
    plugin.ui.toast({
      title: "Compacting conversation...",
      kind: "info",
      duration: 3000
    });
  } catch {}

  const onDemandPrompt =
    "ON-DEMAND COMPACTION:\n" +
    "The user triggered this compaction. Follow any instructions in their latest message, if present.\n" +
    "Compact this conversation history into a concise, high-density <CONTEXT_SUMMARY> checkpoint covering Goal & Scope, Key Decisions & Technical Architecture, Files Created/Modified, Current Status, and Next Steps.\n" +
    "Prune all prior redundant conversational steps so subsequent responses operate strictly from this checkpoint forward.";

  const slashCommandItem = {
    chunk: {
      case: "item",
      value: {
        scopeItem: {
          case: "slashCommand",
          value: {
            info: {
              name: "compact",
              modelFacingText: onDemandPrompt,
              type: 1
            },
            argumentValues: {}
          }
        }
      }
    }
  };

  try {
    const rawFlags = localStorage.getItem("jetski.developer.customFlagOverrides");
    const flags = rawFlags ? JSON.parse(rawFlags) : {};
    if (!flags.enableCompactionNotification) {
      flags.enableCompactionNotification = true;
      localStorage.setItem("jetski.developer.customFlagOverrides", JSON.stringify(flags));
    }
  } catch {}

  let sent = false;
  if (box) {
    const key = Object.keys(box).find((k) => k.startsWith("__reactFiber"));
    let fiber = key ? box[key] : null;
    while (fiber) {
      if (
        typeof fiber.memoizedProps?.handleSubmit === "function" &&
        fiber.type?.name !== "rIb"
      ) {
        const hs = fiber.memoizedProps.handleSubmit;
        try {
          hs([slashCommandItem], [], () => {
            clearEditorState(box);
          });
          sent = true;
        } catch {}
        break;
      }
      fiber = fiber.return;
    }

    if (!sent) {
      let sendFiber = key ? box[key] : null;
      while (sendFiber) {
        if (typeof sendFiber.memoizedProps?.sendMessage === "function") {
          try {
            sendFiber.memoizedProps.sendMessage({
              type: 1,
              items: [slashCommandItem],
              media: []
            });
            sent = true;
          } catch {}
          break;
        }
        sendFiber = sendFiber.return;
      }
    }
  }
}

function setCompactSelected(menu, isSelected) {
  const compactOpt = menu?.querySelector('[data-compact-option="true"]');
  if (!compactOpt) return;

  const row = compactOpt.querySelector(".gemini-compact-row");
  if (isSelected) {
    compactOpt.setAttribute("aria-selected", "true");
    if (row) row.classList.add("bg-secondary");
    const normalOptions = menu.querySelectorAll(
      '[role="option"]:not([data-compact-option])'
    );
    for (const opt of normalOptions) {
      opt.setAttribute("aria-selected", "false");
      const r = opt.querySelector('[class*="bg-secondary"]');
      if (r) r.classList.remove("bg-secondary");
    }
  } else {
    compactOpt.setAttribute("aria-selected", "false");
    if (row) row.classList.remove("bg-secondary");
  }
}

/* ── Input Event Tracking ────────────────────────────────────────────────── */
function onBeforeInput(e) {
  const box = getPromptBox();
  if (!box || !box.contains(e.target)) return;

  const current = getBoxText();
  if (current === "") {
    hadPriorText = false;
    if (e.data === "/") {
      wasEmptyBeforeSlash = true;
    }
  } else {
    if (!current.startsWith("/")) {
      hadPriorText = true;
      wasEmptyBeforeSlash = false;
    }
  }
}

function onInput(e) {
  const box = getPromptBox();
  if (!box || !box.contains(e.target)) return;

  const current = getBoxText();
  if (current === "") {
    hadPriorText = false;
    wasEmptyBeforeSlash = false;
  } else if (current === "/") {
    if (!hadPriorText) {
      wasEmptyBeforeSlash = true;
    }
  } else if (!current.startsWith("/")) {
    hadPriorText = true;
    wasEmptyBeforeSlash = false;
  }
}

function onKeyDown(e) {
  const box = getPromptBox();
  if (box && box.contains(e.target)) {
    const current = getBoxText();
    if (current === "") {
      hadPriorText = false;
      if (e.key === "/") {
        wasEmptyBeforeSlash = true;
      }
    }

    const menu = document.querySelector("[data-mention-menu]");
    if (menu) {
      const compactOpt = menu.querySelector('[data-compact-option="true"]');
      const isCompactVisible =
        compactOpt && compactOpt.style.display !== "none";
      const isCompactSelected =
        isCompactVisible &&
        compactOpt.getAttribute("aria-selected") === "true";

      if (e.key === "Enter" || e.key === "Tab") {
        if (isCompactSelected) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          executeCompaction();
          return;
        }
      } else if (e.key === "ArrowDown" && isCompactSelected) {
        e.preventDefault();
        e.stopPropagation();
        setCompactSelected(menu, false);
        const firstNormal = menu.querySelector(
          '[role="option"]:not([data-compact-option])'
        );
        if (firstNormal) {
          firstNormal.setAttribute("aria-selected", "true");
          const row = firstNormal.querySelector('[class*="flex"]');
          if (row) row.classList.add("bg-secondary");
          firstNormal.scrollIntoView({ block: "nearest" });
        }
        return;
      } else if (e.key === "ArrowUp") {
        const firstNormal = menu.querySelector(
          '[role="option"]:not([data-compact-option])'
        );
        if (
          isCompactVisible &&
          firstNormal &&
          firstNormal.getAttribute("aria-selected") === "true"
        ) {
          e.preventDefault();
          e.stopPropagation();
          setCompactSelected(menu, true);
          compactOpt.scrollIntoView({ block: "nearest" });
          return;
        }
      }
    }
  }
}

function onPointerDown(e) {
  if (
    e.target.closest('[data-compact-option="true"]') ||
    e.target.closest(".gemini-compact-option")
  ) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    executeCompaction();
  }
}

if (typeof window.__bettergravity_compact_cleanup === "function") {
  try {
    window.__bettergravity_compact_cleanup();
  } catch {}
}

const abortController = new AbortController();
const { signal } = abortController;

window.addEventListener("beforeinput", onBeforeInput, { capture: true, signal });
window.addEventListener("input", onInput, { capture: true, signal });
window.addEventListener("keydown", onKeyDown, { capture: true, signal });
window.addEventListener("pointerdown", onPointerDown, { capture: true, signal });

/* ── Menu Filter & Injector ──────────────────────────────────────────────── */
function updateMentionMenu(menu) {
  if (!menu) return;

  const current = getBoxText();
  const showCompact = shouldShowCompact(current);
  const options = menu.querySelectorAll('[role="option"]');

  // Keep normal options visible (along with compact)
  for (const opt of options) {
    if (!opt.hasAttribute("data-compact-option")) {
      opt.style.removeProperty("display");
    }
  }

  let compactOpt = menu.querySelector('[data-compact-option="true"]');

  if (showCompact) {
    if (!compactOpt) {
      compactOpt = document.createElement("div");
      compactOpt.id = "typeahead-item-compact";
      compactOpt.setAttribute("role", "option");
      compactOpt.setAttribute("aria-selected", "false");
      compactOpt.setAttribute("data-compact-option", "true");
      compactOpt.className = "gemini-compact-option";
      compactOpt.innerHTML = `
        <div class="gemini-compact-row">
          <span class="gemini-compact-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 -960 960 960" fill="currentColor">
              <path d="M440-160v-487L304-511l-56-57 232-232 232 232-56 57-136-136v487h-80Zm0-640v-80h80v80h-80Z"/>
            </svg>
          </span>
          <span class="gemini-compact-label" data-testid="menu-option-label">
            <span>compact</span>
          </span>
          <span class="gemini-compact-desc" data-testid="menu-option-description">
            <span>Compact conversation context natively</span>
          </span>
          <span class="gemini-compact-badge">
            SYSTEM
          </span>
        </div>
      `;

      compactOpt.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        executeCompaction();
      });
      compactOpt.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        executeCompaction();
      });

      compactOpt.addEventListener("mouseenter", () => {
        setCompactSelected(menu, true);
      });
      compactOpt.addEventListener("mouseleave", () => {
        setCompactSelected(menu, false);
      });

      const listContainer =
        menu.querySelector('[class*="max-h-"]') ||
        menu.firstElementChild ||
        menu;
      listContainer.prepend(compactOpt);
    } else {
      compactOpt.style.removeProperty("display");
    }

    // Auto-select compact if it is the only matching option (e.g. typing /comp or /compact)
    const visibleNormal = Array.from(options).filter(
      (o) =>
        !o.hasAttribute("data-compact-option") &&
        window.getComputedStyle(o).display !== "none"
    );
    if (visibleNormal.length === 0) {
      setCompactSelected(menu, true);
      const emptyIndicators = menu.querySelectorAll(
        '[aria-label="Searching"], div.text-xs.py-1.px-2'
      );
      for (const indicator of emptyIndicators) {
        if (!indicator.closest('[data-compact-option="true"]')) {
          indicator.style.setProperty("display", "none", "important");
        }
      }
    }
  } else {
    if (compactOpt) {
      compactOpt.style.setProperty("display", "none", "important");
      setCompactSelected(menu, false);
    }
  }
}

let menuMo = null;
const stopMenuObserver = plugin.dom.observe("[data-mention-menu]", (menu) => {
  if (menuMo) {
    try {
      menuMo.disconnect();
    } catch {}
    menuMo = null;
  }
  updateMentionMenu(menu);
  menuMo = new MutationObserver(() => {
    updateMentionMenu(menu);
  });
  menuMo.observe(menu, { childList: true, subtree: true });
});

/* ── Compaction Banner Sync ──────────────────────────────────────────────── */
function syncCompactionBanner() {
  const conversation = document.querySelector('[data-testid="conversation-view"]');
  if (!conversation) return;

  const messages = conversation.querySelectorAll('[data-testid*="message"], .group');
  for (const msg of messages) {
    if (msg.dataset.compactBannerProcessed) continue;
    const text = msg.innerText || "";
    if (
      text.includes("<CONTEXT_SUMMARY>") ||
      text.includes("ON-DEMAND COMPACTION") ||
      text.includes("/compact")
    ) {
      msg.dataset.compactBannerProcessed = "true";
      if (!msg.querySelector('[data-compact-banner="true"]')) {
        const banner = document.createElement("div");
        banner.className = "gemini-compaction-banner";
        banner.setAttribute("data-compact-banner", "true");
        banner.innerHTML = `
          <span class="gemini-compaction-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 -960 960 960" fill="currentColor">
              <path d="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>
            </svg>
          </span>
          <span class="gemini-compaction-text">The conversation was compacted while generating this response.</span>
        `;
        msg.prepend(banner);
      }
    }
  }
}

let convoMo = null;
const stopConvoObserver = plugin.dom.observe('[data-testid="conversation-view"]', (convo) => {
  if (convoMo) {
    try {
      convoMo.disconnect();
    } catch {}
    convoMo = null;
  }
  syncCompactionBanner();
  convoMo = new MutationObserver(() => {
    syncCompactionBanner();
  });
  convoMo.observe(convo, { childList: true, subtree: true });
});

const cleanup = () => {
  try {
    abortController.abort();
  } catch {}
  try {
    menuMo?.disconnect();
  } catch {}
  try {
    stopMenuObserver?.();
  } catch {}
  try {
    convoMo?.disconnect();
  } catch {}
  try {
    stopConvoObserver?.();
  } catch {}
  const compactOpt = document.querySelector('[data-compact-option="true"]');
  if (compactOpt) {
    try {
      compactOpt.remove();
    } catch {}
  }
  const banners = document.querySelectorAll('[data-compact-banner="true"]');
  for (const b of banners) {
    try {
      b.remove();
    } catch {}
  }
  if (window.__bettergravity_compact_cleanup === cleanup) {
    delete window.__bettergravity_compact_cleanup;
  }
};

window.__bettergravity_compact_cleanup = cleanup;
plugin.onDispose(cleanup);
