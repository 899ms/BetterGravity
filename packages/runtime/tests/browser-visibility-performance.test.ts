// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const source = readFileSync("community/plugins/in-built-browser/index.js", "utf8");
const helper = source.slice(source.indexOf("function conversationIsVisible("), source.indexOf("function activeConversationContext("));
const visible: (node: Element) => boolean = new Function(`${helper};return conversationIsVisible;`)();
let previous: PropertyDescriptor | undefined;
let native: ReturnType<typeof vi.fn>;

beforeEach(() => {
  previous = Object.getOwnPropertyDescriptor(Element.prototype, "checkVisibility");
  native = vi.fn(() => true);
  Object.defineProperty(Element.prototype, "checkVisibility", { configurable: true, value: native });
  document.documentElement.style.cssText = "display:block;visibility:visible";
  document.body.style.cssText = "display:block;visibility:visible";
  document.body.innerHTML = '<div style="display:flex;visibility:visible"><main style="display:flex;visibility:visible"></main></div>';
});

afterEach(() => {
  if (previous) Object.defineProperty(Element.prototype, "checkVisibility", previous);
  else Reflect.deleteProperty(Element.prototype, "checkVisibility");
  vi.restoreAllMocks();
  document.body.innerHTML = "";
  document.body.removeAttribute("style");
  document.documentElement.removeAttribute("style");
});

describe("Browser conversation visibility reads", () => {
  it("avoids a layout flush for connected visible chat containers without reading their geometry", () => {
    const chat = document.querySelector("main")!;
    const bounds = vi.spyOn(chat, "getBoundingClientRect");
    const rects = vi.spyOn(chat, "getClientRects");
    for (const display of ["block", "flex", "grid", "flow-root"]) {
      chat.style.display = display;
      expect(visible(chat)).toBe(true);
    }
    expect(native).not.toHaveBeenCalled();
    expect(bounds).not.toHaveBeenCalled();
    expect(rects).not.toHaveBeenCalled();
  });

  it("reads current styles again and uses the native answer for hidden or locked ancestors", () => {
    const chat = document.querySelector("main")!, parent = chat.parentElement!;
    expect(visible(chat)).toBe(true);
    for (const style of ["display:none", "visibility:hidden", "visibility:collapse", "content-visibility:hidden", "content-visibility:auto"]) {
      parent.style.cssText = `display:block;visibility:visible;${style}`;
      native.mockReturnValue(false);
      expect(visible(chat)).toBe(false);
      expect(native).toHaveBeenLastCalledWith({ checkVisibilityCSS: true });
      parent.style.cssText = "display:block;visibility:visible";
      native.mockClear();
      expect(visible(chat)).toBe(true);
      expect(native).not.toHaveBeenCalled();
    }
  });

  it("preserves the native semantics of opacity, transforms, and zero-sized boxes", () => {
    const chat = document.querySelector("main")!;
    chat.style.cssText += ";opacity:0;transform:scale(0);width:0;height:0";
    expect(visible(chat)).toBe(true);
    expect(native).not.toHaveBeenCalled();
  });

  it("defers contents boxes, special HTML parents, detached nodes, and shadow roots to Chrome", () => {
    const chat = document.querySelector("main")!;
    native.mockReturnValue(false);
    chat.style.display = "contents";
    expect(visible(chat)).toBe(false);
    chat.style.display = "block";
    const details = document.createElement("details");
    document.body.append(details); details.append(chat);
    expect(visible(chat)).toBe(false);
    chat.remove();
    expect(visible(chat)).toBe(false);
    const host = document.createElement("div"); document.body.append(host);
    host.attachShadow({ mode: "open" }).append(chat);
    expect(visible(chat)).toBe(false);
    expect(native).toHaveBeenCalledTimes(4);
  });

  it("keeps overridden checks and browsers without checkVisibility on their existing path", () => {
    const chat = document.querySelector("main")!;
    const overridden = vi.fn(function (this: Element) { expect(this).toBe(chat); return false; });
    Object.defineProperty(chat, "checkVisibility", { configurable: true, value: overridden });
    expect(visible(chat)).toBe(false);
    expect(overridden).toHaveBeenCalledExactlyOnceWith({ checkVisibilityCSS: true });
    Object.defineProperty(chat, "checkVisibility", { value: undefined });
    expect(visible(chat)).toBe(true);
  });
});
