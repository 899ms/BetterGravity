// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";

const source = readFileSync("community/plugins/gemini-app/index.js", "utf8");
const handler = source.slice(
  source.indexOf("function handleNewConversationActivation("),
  source.indexOf("function checkUrlForProjectSwitch(")
);

function createHandler() {
  const navigate = vi.fn();
  const markExperience = vi.fn();
  const store = vi.fn();
  const activate = new Function(
    "navigateToExperienceNewConversation", "getStoredExperience", "markExperience", "setStoredExperience",
    `${handler}\nreturn handleNewConversationActivation;`
  )(navigate, () => "work", markExperience, store) as (event: unknown) => void;
  return { activate, navigate, markExperience, store };
}

afterEach(() => {
  document.body.innerHTML = "";
  document.documentElement.removeAttribute("data-gemini-experience");
});

describe("Gemini App new-conversation routing", () => {
  it("uses the selected experience for ordinary New Conversation clicks", () => {
    const { activate, navigate, markExperience } = createHandler();
    activate(new MouseEvent("click", { cancelable: true }));
    expect(navigate).toHaveBeenCalledExactlyOnceWith("work");
    expect(markExperience).not.toHaveBeenCalled();
  });

  // React wraps the pet's DOM click. Ignoring its explicit scope sent quick chat
  // into the last project whenever Work was the selected experience.
  it("routes a pet quick chat to Conversations through React's nativeEvent", () => {
    document.body.innerHTML = '<div id="gemini-experience-switch"></div>';
    const { activate, navigate, markExperience } = createHandler();
    const nativeEvent = new MouseEvent("click", { cancelable: true });
    Object.defineProperty(nativeEvent, "betterGravityProjectless", { value: true });
    activate({ nativeEvent, preventDefault: vi.fn(), stopPropagation: vi.fn() });
    expect(markExperience).toHaveBeenCalledExactlyOnceWith(document.querySelector("#gemini-experience-switch"), "chat", true);
    expect(navigate).toHaveBeenCalledExactlyOnceWith("chat");
  });

  it("remembers Chat when the experience switch has not mounted yet", () => {
    const { activate, navigate, store } = createHandler();
    const event = new MouseEvent("click", { cancelable: true });
    Object.defineProperty(event, "betterGravityProjectless", { value: true });
    activate(event);
    expect(store).toHaveBeenCalledExactlyOnceWith("chat");
    expect(document.documentElement.getAttribute("data-gemini-experience")).toBe("chat");
    expect(navigate).toHaveBeenCalledExactlyOnceWith("chat");
  });
});

describe("Gemini App experience switch notification dots", () => {
  const switchSource = source.slice(
    source.indexOf("function getElementFiber("),
    source.indexOf("function ensureExperienceSwitch(")
  );

  function createSwitchScope(mockStoreState: any) {
    const mockStore = {
      getState: () => mockStoreState,
      subscribe: vi.fn()
    };
    const fn = new Function(
      "EXPERIENCES", "getStoredExperience", "markExperience", "navigateToExperienceNewConversation",
      `
      const plugin = { react: { getFiber: () => ({ memoizedProps: { store: arguments[4] } }) } };
      ${switchSource}
      return { buildExperienceSwitch, updateExperienceSwitchDots, isConversationCompletedUnread };
      `
    );
    return fn(
      [
        { id: "chat", label: "Chat" },
        { id: "work", label: "Work", badge: "beta" }
      ],
      () => "work",
      () => {},
      () => {},
      mockStore
    );
  }

  it("builds experience switch with dot elements before labels in both tabs", () => {
    const scope = createSwitchScope({
      trajectorySummaries: { summaries: {} },
      conversation: { sidebarSections: [], localLastViewedTimes: {} }
    });
    const pill = scope.buildExperienceSwitch();

    const chatTab = pill.querySelector('[data-gemini-experience-tab="chat"]');
    const workTab = pill.querySelector('[data-gemini-experience-tab="work"]');
    expect(chatTab).not.toBeNull();
    expect(workTab).not.toBeNull();

    const chatDot = chatTab.querySelector('[data-gemini-dot="chat"]');
    const chatLabel = chatTab.querySelector('[data-gemini-experience-label]');
    expect(chatDot).not.toBeNull();
    expect(chatDot.nextElementSibling).toBe(chatLabel);

    const workDot = workTab.querySelector('[data-gemini-dot="work"]');
    const workLabel = workTab.querySelector('[data-gemini-experience-label]');
    expect(workDot).not.toBeNull();
    expect(workDot.nextElementSibling).toBe(workLabel);

    const collapsedBtn = pill.querySelector('.gemini-experience-collapsed-btn');
    expect(collapsedBtn.querySelector('.gemini-experience-collapsed-dot')).not.toBeNull();
  });

  it("sets data-has-unread on chat when a chat conversation has completed a task", () => {
    const now = Date.now() / 1000;
    const scope = createSwitchScope({
      trajectorySummaries: {
        summaries: {
          "c1": {
            lastModifiedTime: { seconds: now - 100 },
            annotations: { lastUserViewTime: { seconds: now - 300 } },
            notFullyIdle: false,
            trajectoryType: 1
          }
        }
      },
      conversation: {
        sidebarSections: [
          { id: "outside-of-project", conversationIds: ["c1"] }
        ],
        localLastViewedTimes: {}
      }
    });

    const pill = scope.buildExperienceSwitch();
    const chatDot = pill.querySelector('[data-gemini-dot="chat"]');
    const workDot = pill.querySelector('[data-gemini-dot="work"]');

    expect(chatDot.getAttribute("data-has-unread")).toBe("true");
    expect(workDot.hasAttribute("data-has-unread")).toBe(false);
  });

  it("suppresses unread status when conversation is currently active and focused", () => {
    vi.spyOn(document, "hasFocus").mockReturnValue(true);
    const now = Date.now() / 1000;
    const scope = createSwitchScope({
      trajectorySummaries: {
        summaries: {
          "active-1": {
            lastModifiedTime: { seconds: now - 100 },
            annotations: { lastUserViewTime: { seconds: now - 300 } },
            notFullyIdle: false,
            trajectoryType: 1
          }
        }
      },
      conversation: {
        sidebarSections: [
          { id: "outside-of-project", conversationIds: ["active-1"] }
        ],
        convoState: { cascadeId: "active-1" },
        localLastViewedTimes: {}
      }
    });

    const pill = scope.buildExperienceSwitch();
    const chatDot = pill.querySelector('[data-gemini-dot="chat"]');
    expect(chatDot.hasAttribute("data-has-unread")).toBe(false);
  });

  it("avoids repainting unchanged notification dots during store updates and still clears viewed chats", () => {
    const now = Date.now() / 1000;
    const localTimes: Record<string, number> = {};
    const scope = createSwitchScope({
      trajectorySummaries: { summaries: {
        chat: { lastModifiedTime: { seconds: now - 50 }, notFullyIdle: false, trajectoryType: 1 }
      } },
      conversation: { sidebarSections: [{ id: "outside-of-project", conversationIds: ["chat"] }], localLastViewedTimes: localTimes }
    });
    const pill = scope.buildExperienceSwitch();
    const dot = pill.querySelector('[data-gemini-dot="chat"]');
    const collapsed = pill.querySelector('.gemini-experience-collapsed-btn');
    expect(dot.getAttribute('data-has-unread')).toBe('true');
    expect(collapsed.getAttribute('data-has-unread')).toBe('true');
    const observer = new MutationObserver(() => {});
    observer.observe(pill, { subtree: true, attributes: true, attributeFilter: ['data-has-unread'] });
    try {
      for (let i = 0; i < 20; i++) scope.updateExperienceSwitchDots(pill);
      expect(observer.takeRecords()).toHaveLength(0);
      localTimes.chat = now;
      scope.updateExperienceSwitchDots(pill);
      expect(dot.hasAttribute('data-has-unread')).toBe(false);
      expect(collapsed.hasAttribute('data-has-unread')).toBe(false);
      expect(observer.takeRecords()).toHaveLength(2);
      scope.updateExperienceSwitchDots(pill);
      expect(observer.takeRecords()).toHaveLength(0);
    } finally {
      observer.disconnect();
    }
  });

  it("sets data-has-unread on work and on collapsed button when a project conversation has completed a task", () => {
    const now = Date.now() / 1000;
    const scope = createSwitchScope({
      trajectorySummaries: {
        summaries: {
          "proj-conv-1": {
            lastModifiedTime: { seconds: now - 50 },
            annotations: { lastUserViewTime: { seconds: now - 500 } },
            notFullyIdle: false,
            trajectoryType: 1
          }
        }
      },
      conversation: {
        sidebarSections: [
          { id: "project-uuid-1", conversationIds: ["proj-conv-1"] }
        ],
        localLastViewedTimes: {}
      }
    });

    const pill = scope.buildExperienceSwitch();
    const chatDot = pill.querySelector('[data-gemini-dot="chat"]');
    const workDot = pill.querySelector('[data-gemini-dot="work"]');
    const collapsedBtn = pill.querySelector('.gemini-experience-collapsed-btn');

    expect(chatDot.hasAttribute("data-has-unread")).toBe(false);
    expect(workDot.getAttribute("data-has-unread")).toBe("true");
    // In mock, getStoredExperience() returns "work", so inactive is "chat" (false), but if current is "chat", collapsed has-unread is true
    pill.dataset.geminiExperience = "chat";
    scope.updateExperienceSwitchDots(pill);
    expect(collapsedBtn.getAttribute("data-has-unread")).toBe("true");
  });
});

describe("Gemini App search wildcard sanitation", () => {
  const wildcardSource = source.slice(
    source.indexOf("const SEARCH_ROW_SELECTOR ="),
    source.indexOf("plugin.dom.observe(SEARCH_ROW_SELECTOR")
  );
  const { sanitizeSearchWildcardRow, sanitizeSearchWildcards } = new Function(
    `${wildcardSource}\nreturn { sanitizeSearchWildcardRow, sanitizeSearchWildcards };`
  )();

  function createSearchRow(labelText: string, queryText: string, resultCount?: number) {
    const row = document.createElement("div");
    row.className = "flex items-center gap-1 overflow-hidden text-sm group";

    const label = document.createElement("span");
    label.className = "text-secondary-foreground shrink-0";
    label.textContent = labelText;
    row.appendChild(label);

    const query = document.createElement("span");
    query.className = "overflow-hidden text-ellipsis whitespace-nowrap";
    query.textContent = queryText;
    row.appendChild(query);

    if (typeof resultCount === "number") {
      const badge = document.createElement("span");
      badge.className = "shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-xs leading-none text-muted-foreground";
      badge.textContent = `${resultCount} results`;
      row.appendChild(badge);
    }
    return row;
  }

  it("marks bare wildcard queries as hidden with data-gemini-wildcard='true'", () => {
    for (const wildcard of ["*", "**/*", '"*"', "'*'"]) {
      const row = createSearchRow("Searched", wildcard, 132);
      sanitizeSearchWildcardRow(row);
      const querySpan = row.children[1];
      expect(querySpan?.getAttribute("data-gemini-wildcard")).toBe("true");
    }
  });

  it("also sanitizes rows during active 'Searching' state", () => {
    const row = createSearchRow("Searching", "*", 0);
    sanitizeSearchWildcardRow(row);
    expect(row.children[1]?.getAttribute("data-gemini-wildcard")).toBe("true");
  });

  it("preserves non-wildcard or specific search queries", () => {
    for (const validQuery of ["*.ts", "*.html", "auth", "foo*bar", "**/*.json"]) {
      const row = createSearchRow("Searched", validQuery, 12);
      sanitizeSearchWildcardRow(row);
      const querySpan = row.children[1];
      expect(querySpan?.hasAttribute("data-gemini-wildcard")).toBe(false);
    }
  });

  it("does not modify rows with non-search labels", () => {
    const row = createSearchRow("Executed", "*", 1);
    sanitizeSearchWildcardRow(row);
    expect(row.children[1]?.hasAttribute("data-gemini-wildcard")).toBe(false);
  });

  it("clears data-gemini-wildcard if query changes to a non-wildcard string", () => {
    const row = createSearchRow("Searched", "*", 10);
    sanitizeSearchWildcardRow(row);
    expect(row.children[1]?.getAttribute("data-gemini-wildcard")).toBe("true");

    const querySpan = row.children[1];
    if (querySpan) {
      querySpan.textContent = "main.ts";
    }
    sanitizeSearchWildcardRow(row);
    expect(row.children[1]?.hasAttribute("data-gemini-wildcard")).toBe(false);
  });

  it("sanitizes multiple rows inside a container subtree via sanitizeSearchWildcards", () => {
    const container = document.createElement("div");
    const row1 = createSearchRow("Searched", "*", 5);
    const row2 = createSearchRow("Searched", "component.tsx", 1);
    const row3 = createSearchRow("Searched", "**/*", 100);
    container.appendChild(row1);
    container.appendChild(row2);
    container.appendChild(row3);

    sanitizeSearchWildcards(container);
    expect(row1.children[1]?.getAttribute("data-gemini-wildcard")).toBe("true");
    expect(row2.children[1]?.hasAttribute("data-gemini-wildcard")).toBe(false);
    expect(row3.children[1]?.getAttribute("data-gemini-wildcard")).toBe("true");
  });
});

