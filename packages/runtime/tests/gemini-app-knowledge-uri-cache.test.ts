import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { applySourcePatches, readPatches } from "../src/main/source-patch.js";

const manifest = JSON.parse(readFileSync("community/plugins/gemini-app/plugin.json", "utf8"));
const patch = readPatches("gemini-app", manifest)!.patches.find(p => p.find === "knowledgeItemsByAuthority")!;
const nativeSource = `var o6a=()=>{var {knowledgeItemsByAuthority:a}=Xka;return(0,z.useCallback)(b=>{var c=ds(b).authority;return n6a(b,a[c]||[])},[a])};function n6a(a,b){var c=Uba(a);return b.some(e=>e.artifactSourceUris.includes(c))}`;
type Knowledge = { artifactSourceUris: unknown[] };

function fixture() {
  const result = applySourcePatches(nativeSource, [{ pluginId: "gemini-app", patches: [patch] }]);
  expect(result.failures).toEqual([]);
  const state = { knowledgeItemsByAuthority: {} as Record<string, Knowledge[]> };
  const parse = vi.fn((uri: unknown) => ({ authority: new URL(String(uri)).host }));
  const normalize = vi.fn((uri: unknown) => {
    if (typeof uri !== "string") return (uri as { with: (options: object) => unknown }).with({ fragment: null });
    const value = new URL(uri);
    value.hash = "";
    return value.href;
  });
  const callback = vi.fn((fn: (uri: unknown) => boolean, _dependencies: unknown[]) => fn);
  const dependencies = { Xka: state, z: { useCallback: callback }, ds: parse, Uba: normalize };
  const compile = (code: string) => new Function(...Object.keys(dependencies), `${code};return {hook:o6a,match:n6a};`)(...Object.values(dependencies));
  const native = compile(nativeSource), candidate = compile(result.source);
  return {
    native, candidate, state, parse, normalize, callback,
    compare(uri: unknown): boolean {
      const value = candidate.hook()(uri);
      expect(value).toBe(native.hook()(uri));
      return value;
    }
  };
}

const file = (name: string) => `file:///workspace/${name}`;

describe("Gemini App knowledge URI text", () => {
  it("reuses parsing across composer mounts without storing classification results", () => {
    const f = fixture();
    const paths = Array.from({ length: 1323 }, (_, index) => file(`${index}.ts#L10`));
    for (const uri of paths) expect(f.candidate.hook()(uri)).toBe(false);
    expect(f.parse).toHaveBeenCalledTimes(1323);
    expect(f.normalize).toHaveBeenCalledTimes(1323);
    f.parse.mockClear(); f.normalize.mockClear();
    for (let render = 0; render < 10; render++) {
      const classify = f.candidate.hook();
      for (const uri of paths) expect(classify(uri)).toBe(false);
    }
    expect(f.parse).not.toHaveBeenCalled();
    expect(f.normalize).not.toHaveBeenCalled();
  });

  it("observes in-place source edits, record replacement, removal, and authority changes", () => {
    const f = fixture();
    const local = { artifactSourceUris: [] as unknown[] };
    const rows = [local];
    f.state.knowledgeItemsByAuthority[""] = rows;
    expect(f.compare(file("notes.md#one"))).toBe(false);
    local.artifactSourceUris.push(file("notes.md"));
    expect(f.compare(file("notes.md#one"))).toBe(true);
    local.artifactSourceUris[0] = file("other.md");
    expect(f.compare(file("notes.md#one"))).toBe(false);
    rows[0] = { artifactSourceUris: [file("notes.md")] };
    expect(f.compare(file("notes.md#one"))).toBe(true);
    rows.length = 0;
    expect(f.compare(file("notes.md#one"))).toBe(false);
    const remote = "https://remote.example/notes.md#one";
    f.state.knowledgeItemsByAuthority["remote.example"] = [{ artifactSourceUris: [remote.split("#")[0]!] }];
    expect(f.compare(remote)).toBe(true);
    f.state.knowledgeItemsByAuthority = {};
    expect(f.compare(remote)).toBe(false);
  });

  it("keeps native URI normalization, live accessors, and callback dependencies", () => {
    const f = fixture();
    const uri = "https://remote.example/file%20name.md?query=one#L20";
    const getter = vi.fn(() => [uri.split("#")[0]]);
    const rows = [{ get artifactSourceUris() { return getter(); } }];
    f.state.knowledgeItemsByAuthority["remote.example"] = rows;
    const native = f.native.hook(), candidate = f.candidate.hook();
    expect(f.callback.mock.calls.map(([, dependencies]) => dependencies)).toEqual([
      [f.state.knowledgeItemsByAuthority], [f.state.knowledgeItemsByAuthority]
    ]);
    expect(candidate(uri)).toBe(native(uri));
    expect(candidate(uri)).toBe(true);
    expect(getter).toHaveBeenCalledTimes(3);
  });

  it("preserves failures even with empty knowledge lists and retries on every call", () => {
    const f = fixture();
    expect(() => f.candidate.hook()("invalid")).toThrow();
    expect(() => f.candidate.hook()("invalid")).toThrow();
    expect(f.parse).toHaveBeenCalledTimes(2);
    f.normalize.mockImplementation(() => { throw new Error("normalization failed"); });
    expect(() => f.candidate.hook()(file("valid.md"))).toThrow("normalization failed");
    expect(() => f.candidate.hook()(file("valid.md"))).toThrow("normalization failed");
    expect(f.normalize).toHaveBeenCalledTimes(2);
  });

  it("leaves URI objects on the native path and retains their membership identity", () => {
    const f = fixture();
    let normalized = {};
    const uri = { toString: () => file("notes.md"), with: vi.fn(() => normalized) };
    const rows = [{ artifactSourceUris: [normalized] }];
    expect(f.candidate.match(uri, rows)).toBe(true);
    normalized = {};
    expect(f.candidate.match(uri, rows)).toBe(false);
    expect(uri.with).toHaveBeenCalledTimes(2);
    expect(uri.with).toHaveBeenCalledWith({ fragment: null });
  });

  it("bounds entry count and total retained URI characters", () => {
    const f = fixture();
    const classify = f.candidate.hook();
    for (let index = 0; index < 4097; index++) classify(file(`${index}.md`));
    f.parse.mockClear(); f.normalize.mockClear();
    classify(file("4096.md"));
    expect(f.parse).not.toHaveBeenCalled();
    classify(file("0.md"));
    expect(f.parse).toHaveBeenCalledTimes(1);
    const long = [file("a".repeat(300_000)), file("b".repeat(300_000))];
    for (const uri of long) classify(uri);
    f.parse.mockClear(); f.normalize.mockClear();
    classify(long[0]);
    expect(f.parse).toHaveBeenCalledTimes(1);
    expect(f.normalize).toHaveBeenCalledTimes(1);
  });

  it("keeps changed native code intact and supports renamed native symbols", () => {
    const changed = nativeSource.replace("artifactSourceUris.includes", "artifactSourceUris.has");
    const skipped = applySourcePatches(changed, [{ pluginId: "gemini-app", patches: [patch] }]);
    expect(skipped.failures).toHaveLength(1);
    expect(skipped.source).toBe(changed);
    const renamed = nativeSource.replace(/\bo6a\b/g, "useKnowledge").replace(/\bn6a\b/g, "isKnowledge").replace(/\bz\b/g, "React");
    const applied = applySourcePatches(renamed, [{ pluginId: "gemini-app", patches: [patch] }]);
    expect(applied.failures).toEqual([]);
    expect(() => new Function(applied.source)).not.toThrow();
    expect(applied.source).toContain("React.useCallback");
    expect(applied.source).toContain("function isKnowledge");
  });
});
