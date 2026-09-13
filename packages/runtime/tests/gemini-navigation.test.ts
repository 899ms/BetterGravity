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
