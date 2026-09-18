/**
 * Windows Computer Use Action Handlers
 * Executes real actions targeting Windows desktop apps via WindowsNativeRunner
 */

import { WindowsCaptureNativeBridge } from "../core/windows-capture-native-bridge.js";
import { WindowsHelperTransport } from "../core/windows-helper-transport.js";
import { WindowsIconExtractor } from "../core/windows-icon-extractor.js";
import { WindowsNativeRunner } from "../core/windows-native-runner.js";
import { extractAppName } from "./tool-labels.js";

export function extractTargetCoords(args = {}) {
  const t = args.target ?? args.coordinates ?? args.point ?? args.coord;
  if (Array.isArray(t) && t.length >= 2) {
    return [Number(t[0]), Number(t[1])];
  }
  if (t && typeof t === "object" && t.x !== undefined && t.y !== undefined) {
    return [Number(t.x), Number(t.y)];
  }
  if (args.x !== undefined && args.y !== undefined) {
    return [Number(args.x), Number(args.y)];
  }
  return null;
}

export function extractElementIndex(args = {}) {
  if (typeof args.element_index === "number") return args.element_index;
  if (typeof args.target === "number") return args.target;
  if (typeof args.index === "number") return args.index;
  return undefined;
}

export class WindowsComputerUseActionHandler {
  constructor({ helperTransport = null, captureBridge = null, nativeRunner = null } = {}) {
    this.nativeRunner = nativeRunner || new WindowsNativeRunner();
    this.helperTransport = helperTransport || new WindowsHelperTransport({});
    this.captureBridge = captureBridge || new WindowsCaptureNativeBridge({
      loadHelperTransport: async () => this.helperTransport,
    });
    this.iconExtractor = new WindowsIconExtractor();
    this.mousePosition = { x: 0, y: 0 };
  }

  /**
   * 1. Click (Windows SendInput / mouse_event click)
   */
  async click(args = {}) {
    const { mouse_button = "left", click_count = 1, app } = args;
    const coords = extractTargetCoords(args);
    const elementIndex = extractElementIndex(args);

    if (coords) {
      this.mousePosition.x = coords[0];
      this.mousePosition.y = coords[1];
    }

    return await this.nativeRunner.click({
      target: coords,
      element_index: elementIndex,
      mouse_button,
      click_count,
      app: extractAppName({ app }),
    });
  }

  async doubleClick(args = {}) {
    return await this.click({ ...args, mouse_button: "left", click_count: 2 });
  }

  async rightClick(args = {}) {
    return await this.click({ ...args, mouse_button: "right", click_count: 1 });
  }

  async middleClick(args = {}) {
    return await this.click({ ...args, mouse_button: "middle", click_count: 1 });
  }

  /**
   * 2. Drag (Windows mouse drag)
   */
  async drag(args = {}) {
    const { app } = args;
    const from = extractTargetCoords({ target: args.from }) || (Array.isArray(args.from) ? args.from : [0, 0]);
    const to = extractTargetCoords({ target: args.to }) || (Array.isArray(args.to) ? args.to : from);

    this.mousePosition.x = to[0];
    this.mousePosition.y = to[1];

    return await this.nativeRunner.drag({
      from,
      to,
      app: extractAppName({ app }),
    });
  }

  /**
   * 3. Scroll (Windows mouse wheel)
   */
  async scroll(args = {}) {
    const { direction = "down", pages = 1, app } = args;
    const coords = extractTargetCoords(args);
    const elementIndex = extractElementIndex(args);

    return await this.nativeRunner.scroll({
      target: coords,
      element_index: elementIndex,
      direction,
      pages,
      app: extractAppName({ app }),
    });
  }

  /**
   * 4. Type Text (Windows SendInput unicode)
   */
  async typeText(args = {}) {
    const { text, app } = args;
    const coords = extractTargetCoords(args);
    const elementIndex = extractElementIndex(args);

    return await this.nativeRunner.typeText({
      text: text ?? args.value ?? args.string ?? "",
      target: coords,
      element_index: elementIndex,
      app: extractAppName({ app }),
    });
  }

  /**
   * 5. Press Key (Windows virtual keys & hotkeys)
   */
  async pressKey({ key, app } = {}) {
    return await this.nativeRunner.pressKey({
      key,
      app: extractAppName({ app }),
    });
  }

  /**
   * 6. Set Value (Windows UI Automation / direct typing)
   */
  async setValue(args = {}) {
    const { app } = args;
    const val = args.value ?? args.targetValue ?? args.target_value ?? "";
    const elementIndex = extractElementIndex(args);

    return await this.nativeRunner.setValue({
      element_index: elementIndex,
      value: val,
      app: extractAppName({ app }),
    });
  }

  /**
   * 7. Get App State (Windows Capture & UI Automation Tree)
   */
  async getAppState({ app, content = "axStateAndScreenshot", disable_diffing = false } = {}) {
    const state = await this.nativeRunner.getAppState({
      app: extractAppName({ app }),
    });

    return {
      status: "success",
      platform: "win32",
      app: state.app || extractAppName({ app }),
      accessibility: state.accessibility || { tree: `[Window: "${state.app || "Desktop"}"]` },
      screenshots: state.screenshots || [],
      transitionSnapshotURL: null,
    };
  }

  /**
   * 8. List Apps (Windows running applications + icon extraction)
   */
  async listApps({ include_hidden = false } = {}) {
    const apps = await this.nativeRunner.listApps();
    return Array.isArray(apps) ? apps : [];
  }

  /**
   * 9. Perform Accessibility Action (Windows UI Automation Invoke/Expand)
   */
  async performAccessibilityAction(args = {}) {
    const { action = "invoke", app } = args;
    const elementIndex = extractElementIndex(args) ?? 0;

    return await this.nativeRunner.performAccessibilityAction({
      element_index: elementIndex,
      action,
      app: extractAppName({ app }),
    });
  }

  /**
   * 10. Appshot Capture (Windows Window Snapping)
   */
  async captureAppshot({ window: targetWindow, transitionId }) {
    return await this.nativeRunner.getAppState({
      app: extractAppName({ app: targetWindow?.app }),
    });
  }
}
