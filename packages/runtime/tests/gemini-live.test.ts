// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const manifest = JSON.parse(readFileSync("community/plugins/gemini-live/plugin.json", "utf8"));
const pluginSource = readFileSync("community/plugins/gemini-live/index.js", "utf8");
const cssSource = readFileSync("community/plugins/gemini-live/styles/gemini-live.css", "utf8");

describe("Gemini Live plugin manifest & style integrity", () => {
  it("conforms to the community manifest standard", () => {
    expect(manifest.name).toBe("Gemini Live");
    expect(manifest.version).toBe("0.2.0");
    expect(manifest.main).toBe("index.js");
    expect(manifest.styles).toEqual(["styles/gemini-live.css"]);
    expect(typeof manifest.description).toBe("string");
    expect(manifest.description.length).toBeGreaterThan(10);
    expect(manifest.author).toBe("Yashjit Pal");
  });

  it("contains no console logging methods in project code", () => {
    expect(pluginSource).not.toMatch(/console\.(log|debug|info|warn)\(/);
  });

  it("contains no remote URL references in stylesheets", () => {
    expect(cssSource).not.toMatch(/url\s*\(\s*["']?https?:/i);
    expect(cssSource).toContain(".gemini-live-button");
    expect(cssSource).toContain(".gemini-live-bar");
    expect(cssSource).toContain(".gemini-live-focus-surface");
    expect(cssSource).toContain(".gemini-live-orb");
    expect(cssSource).toContain(".gemini-live-dock");
    expect(cssSource).toContain(".gemini-live-modal-card");
    expect(cssSource).toContain('[data-testid="send-button"]:not(:disabled)');
  });
});

describe("Gemini Live plugin settings & coding handoff", () => {
  let cleanups: (() => void)[] = [];
  let observers: { selector: string; callback: (el: HTMLElement) => void }[] = [];
  let registeredSchema: any = null;

  beforeEach(() => {
    cleanups = [];
    observers = [];
    registeredSchema = null;
    document.body.innerHTML = "";
  });

  afterEach(() => {
    for (const fn of cleanups) {
      try {
        fn();
      } catch {}
    }
    document.body.innerHTML = "";
  });

  function executePlugin(initialSettings: Record<string, any> = {}) {
    const mockPlugin = {
      settings: {
        define: (schema: any) => {
          registeredSchema = schema;
          const accessor: Record<string, any> = {};
          for (const key of Object.keys(schema)) {
            accessor[key] = initialSettings[key] !== undefined ? initialSettings[key] : schema[key].default;
          }
          return accessor;
        },
        get: (key: string) => initialSettings[key]
      },
      dom: {
        observe: (selector: string, callback: (el: HTMLElement) => void) => {
          observers.push({ selector, callback });
          const existing = document.querySelectorAll(selector);
          existing.forEach((el) => callback(el as HTMLElement));
          return () => {
            const idx = observers.findIndex((o) => o.selector === selector && o.callback === callback);
            if (idx >= 0) observers.splice(idx, 1);
          };
        }
      },
      onDispose: (fn: () => void) => {
        cleanups.push(fn);
      },
      ui: {
        toast: vi.fn()
      }
    };

    const run = new Function("plugin", "window", "document", pluginSource);
    run(mockPlugin, window, document);
    return mockPlugin;
  }

  function setupComposerDom(options: { hasText?: boolean; isRunning?: boolean } = {}) {
    document.body.innerHTML = `
      <button type="button" data-testid="titlebar-more-actions" aria-label="More actions"></button>
      <div data-testid="agent-input-box" class="flex flex-col w-full">
        <div class="relative flex flex-col p-px rounded-2xl bg-card-border">
          <div class="bg-card">
            <div class="justify-between flex">
              <div></div>
              <div class="flex items-center gap-1">
                <div class="flex items-center">
                  <button type="button" aria-label="Record voice memo"></button>
                </div>
                ${
                  options.isRunning
                    ? '<button type="button" aria-label="Cancel (Ctrl+D)" data-tooltip-id="input-send-button-cancel-tooltip"></button>'
                    : `<button type="button" aria-label="Send message" data-testid="send-button" ${
                        options.hasText ? "" : "disabled"
                      }></button>`
                }
              </div>
            </div>
            <div contenteditable="true">${options.hasText ? "Hello world" : ""}</div>
          </div>
        </div>
      </div>
      <div data-testid="conversation-view">
        <div role="article">Assistant: How can I help?</div>
      </div>
    `;
    return document.querySelector('[data-testid="agent-input-box"]') as HTMLElement;
  }

  it("registers settings schema including apiKey, model options, and voice", () => {
    executePlugin();

    expect(registeredSchema).not.toBeNull();
    expect(registeredSchema.apiKey.type).toBe("string");
    expect(registeredSchema.apiKey.secret).toBe(true);

    expect(registeredSchema.model.type).toBe("select");
    const modelOptions = registeredSchema.model.options.map((o: any) => o.value);
    expect(modelOptions).toContain("3.8-flash-live");
    expect(modelOptions).toContain("3.8-flash-live-extended");

    expect(registeredSchema.voice.type).toBe("select");
    const voiceOptions = registeredSchema.voice.options.map((o: any) => o.value);
    expect(voiceOptions).toContain("Puck");
    expect(voiceOptions).toContain("Charon");
  });

  it("mounts Live button in empty prompt and hides it when text is entered", () => {
    setupComposerDom({ hasText: false });
    executePlugin();

    const liveBtn = document.querySelector('[data-testid="gemini-live-button"]') as HTMLButtonElement;
    expect(liveBtn).not.toBeNull();
    expect(liveBtn.getAttribute("data-hidden")).toBeNull();

    // Add text to prompt box
    const editable = document.querySelector('[contenteditable="true"]') as HTMLElement;
    editable.innerText = "Here is my code prompt";
    const box = document.querySelector('[data-testid="agent-input-box"]') as HTMLElement;
    box.dispatchEvent(new Event("input", { bubbles: true }));

    expect(liveBtn.getAttribute("data-hidden")).toBe("true");

    // Clear text
    editable.innerText = "";
    box.dispatchEvent(new Event("input", { bubbles: true }));

    expect(liveBtn.getAttribute("data-hidden")).toBeNull();
  });

  it("hides Live button when agent is running", () => {
    setupComposerDom({ isRunning: true });
    executePlugin();

    const liveBtn = document.querySelector('[data-testid="gemini-live-button"]') as HTMLButtonElement;
    expect(liveBtn).not.toBeNull();
    expect(liveBtn.getAttribute("data-hidden")).toBe("true");
  });

  it("prompts for API key when Live button is clicked without key configured", () => {
    const savedEnvKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      setupComposerDom({ hasText: false });
      const mock = executePlugin({ apiKey: "" });

      const liveBtn = document.querySelector('[data-testid="gemini-live-button"]') as HTMLButtonElement;
      liveBtn.click();

      expect(mock.ui.toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining("API Key Required")
        })
      );
    } finally {
      if (savedEnvKey !== undefined) process.env.GEMINI_API_KEY = savedEnvKey;
    }
  });

  it("mounts Voice Focus Surface, Celestial Orb, and controls dock when Live session starts", () => {
    // Mock web audio, web socket, and media devices
    (window as any).AudioContext = class {
      state = "running";
      currentTime = 0;
      resume = vi.fn();
      close = vi.fn();
      createAnalyser = () => ({
        fftSize: 64,
        smoothingTimeConstant: 0.4,
        connect: vi.fn(),
        getByteFrequencyData: vi.fn()
      });
      createMediaStreamSource = () => ({ connect: vi.fn() });
      createScriptProcessor = () => ({ connect: vi.fn(), disconnect: vi.fn() });
      createGain = () => ({ gain: { value: 1 }, connect: vi.fn() });
      destination = {};
    };
    (window as any).WebSocket = class {
      static OPEN = 1;
      readyState = 1;
      send = vi.fn();
      close = vi.fn();
    };
    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }]
        })
      },
      configurable: true
    });

    setupComposerDom({ hasText: false });
    executePlugin({ apiKey: "AIzaSyFakeKeyForTesting123" });

    const liveBtn = document.querySelector('[data-testid="gemini-live-button"]') as HTMLButtonElement;
    liveBtn.click();

    const surface = document.querySelector(".gemini-live-focus-surface") as HTMLElement;
    expect(surface).not.toBeNull();
    expect(surface.getAttribute("data-focus-mode")).toBe("expanded");

    // Orb and layers
    const orb = surface.querySelector(".gemini-live-orb");
    expect(orb).not.toBeNull();
    expect(surface.querySelector(".gemini-live-orb-swirl")).not.toBeNull();
    expect(surface.querySelector(".gemini-live-orb-highlight")).not.toBeNull();

    // Dock is removed (controls integrated into composer and titlebar)
    const dock = surface.querySelector(".gemini-live-dock");
    expect(dock).toBeNull();

    // Orb button toggles between expanded and floating modes
    const orbBtn = surface.querySelector(".gemini-live-orb-btn") as HTMLButtonElement;
    expect(orbBtn).not.toBeNull();

    // Toggle mode to floating
    orbBtn.click();
    expect(surface.getAttribute("data-focus-mode")).toBe("floating");

    // Toggle back to expanded
    orbBtn.click();
    expect(surface.getAttribute("data-focus-mode")).toBe("expanded");

    // Composer mic button acts as mute toggle
    const micBtn = document.querySelector('button[data-live-mic-mute="true"]') as HTMLButtonElement;
    expect(micBtn).not.toBeNull();
    expect(micBtn.getAttribute("aria-label")).toBe("Turn off microphone");
    expect(micBtn.getAttribute("data-muted")).toBeNull();

    // Mute mic
    micBtn.click();
    expect(micBtn.getAttribute("data-muted")).toBe("true");
    expect(micBtn.getAttribute("aria-label")).toBe("Turn on microphone");
    expect(micBtn.querySelector(".gemini-mic-muted-slash")).not.toBeNull();

    // Unmute mic
    micBtn.click();
    expect(micBtn.getAttribute("data-muted")).toBeNull();
    expect(micBtn.getAttribute("aria-label")).toBe("Turn off microphone");
    expect(micBtn.querySelector(".gemini-mic-muted-slash")).toBeNull();

    // Titlebar more actions button acts as voice changer
    const moreBtn = document.querySelector('[data-testid="titlebar-more-actions"]') as HTMLButtonElement;
    expect(moreBtn.getAttribute("data-live-voice-changer")).toBe("true");
    moreBtn.click();

    const modal = document.querySelector(".gemini-live-modal-scrim") as HTMLElement;
    expect(modal).not.toBeNull();
    expect(modal.querySelector(".gemini-live-modal-card")).not.toBeNull();

    // Carousel navigation
    const voiceNameEl = modal.querySelector(".gemini-live-voice-name") as HTMLElement;
    expect(voiceNameEl.textContent).toBe("Puck");
    const nextBtn = modal.querySelector('[data-dir="next"]') as HTMLButtonElement;
    nextBtn.click();
    expect(voiceNameEl.textContent).toBe("Charon");

    // Save/Done closes modal
    const doneBtn = modal.querySelector('[data-action="save"]') as HTMLButtonElement;
    doneBtn.click();
    expect(document.querySelector(".gemini-live-modal-scrim")).toBeNull();

    // Send slot displays ongoing stop button during live session
    expect(liveBtn.getAttribute("data-ongoing")).toBe("true");
    expect(liveBtn.getAttribute("title")).toBe("Stop live mode");

    // Clicking ongoing stop button ends call and removes focus surface
    liveBtn.click();
    expect(document.querySelector(".gemini-live-focus-surface")).toBeNull();
    expect(liveBtn.getAttribute("data-ongoing")).toBeNull();
  });

  it("cleans up all injected elements on disposal", () => {
    setupComposerDom({ hasText: false });
    executePlugin();

    expect(document.querySelector('[data-testid="gemini-live-button"]')).not.toBeNull();

    for (const fn of cleanups) fn();

    expect(document.querySelector('[data-testid="gemini-live-button"]')).toBeNull();
  });
});
