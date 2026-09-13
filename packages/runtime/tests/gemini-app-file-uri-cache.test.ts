import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { applySourcePatches, readPatches } from "../src/main/source-patch.js";

const manifest = JSON.parse(readFileSync("community/plugins/gemini-app/plugin.json", "utf8"));
const patch = readPatches("gemini-app", manifest)!.patches.find(p => p.find === "Failed to match URI authority:")!;

// The native changed-file URI selector. Other diff selectors still read the
// actual file contents on every update; this projection contains paths only.
const nativeSource = `var gca={selector:function(a,b){return(a=lh(a))?a.map(c=>{try{return fh(c.uri,b).toString()}catch(e){return console.error("Failed to match URI authority:",
c.uri,b,e),null}}).filter(c=>c!==null):[]},equalityFn:rg};`;
type Row = { uri: string; modifiedContent?: string };
type State = { list?: Row[] };

function fixture(source = nativeSource) {
  const result = applySourcePatches(source, [{ pluginId: "gemini-app", patches: [patch] }]);
  if (source === nativeSource) expect(result.failures).toEqual([]);
  const normalize = vi.fn((uri: string, workspace?: unknown) => {
    if (typeof uri !== "string" || uri === "invalid") throw new Error("invalid URI");
    const parsed = new URL(uri, workspace ? String(workspace) : "file:///workspace/");
    return { toString: () => parsed.href };
  });
  const error = vi.fn();
  const equality = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
  const dependencies = { lh: (state?: State) => state?.list, fh: normalize, rg: equality, console: { error } };
  const compile = (code: string) => new Function(...Object.keys(dependencies), `${code}\nreturn gca;`)(...Object.values(dependencies));
  const native = compile(nativeSource), candidate = compile(result.source);
  const select = (list?: Row[], workspace?: unknown): string[] => candidate.selector({ list }, workspace);
  return {
    select, candidate, native, normalize, error, equality, result,
    compare(list?: Row[], workspace?: unknown): string[] {
      const value = select(list, workspace);
      expect(value).toEqual(native.selector({ list }, workspace));
      return value;
    }
  };
}

const row = (name: string): Row => ({ uri: `file:///workspace/${name}` });

describe("Gemini App changed-file URI projection", () => {
  it("reuses paths across provider updates and conversation mounts without reparsing unchanged files", () => {
    const f = fixture();
    const list = Array.from({ length: 1323 }, (_, index) => row(`file-${index}.ts`));
    const first = f.compare(list);
    f.normalize.mockClear();
    for (let update = 0; update < 20; update++) {
      list[0]!.modifiedContent = `New contents ${update}`;
      expect(f.select(list)).toBe(first);
      expect(f.select(list.map(item => ({ ...item })))).toBe(first);
    }
    expect(f.normalize).not.toHaveBeenCalled();
    expect(f.candidate.equalityFn).toBe(f.equality);
  });

  it("reflects insertion, removal, replacement, reordering, duplicate paths, and in-place URI edits", () => {
    const f = fixture();
    const list = [row("first.ts"), row("second.ts"), row("first.ts")];
    f.compare(list);
    list[0]!.uri = "file:///workspace/renamed.ts"; f.compare(list);
    list.push(row("new.ts")); f.compare(list);
    list.reverse(); f.compare(list);
    list[1] = row("replacement.ts"); f.compare(list);
    list.splice(0, 1); f.compare(list);
    list.length = 0; f.compare(list);
  });

  it("keeps native URL normalization and separates workspace projections", () => {
    const f = fixture();
    const list = [{ uri: "./folder/file%20name.ts#fragment" }, { uri: "../file.ts?query=1" }];
    const first = f.compare(list, "https://first.example/workspace/");
    const second = f.compare(list, "https://second.example/project/");
    expect(first).not.toEqual(second);
    f.normalize.mockClear();
    expect(f.select(list, "https://first.example/workspace/")).toBe(first);
    expect(f.select(list, "https://second.example/project/")).toBe(second);
    expect(f.normalize).not.toHaveBeenCalled();
  });

  it("retries failed conversions and keeps the native error/filter behavior", () => {
    const f = fixture();
    const list = [row("valid.ts"), { uri: "invalid" }];
    expect(f.select(list)).toEqual(["file:///workspace/valid.ts"]);
    expect(f.select(list)).toEqual(["file:///workspace/valid.ts"]);
    expect(f.error).toHaveBeenCalledTimes(2);
    expect(f.normalize).toHaveBeenCalledTimes(4);
    list[1]!.uri = "file:///workspace/fixed.ts";
    f.compare(list);
  });

  it("does not invoke URI or array-slot accessors while checking the cache", () => {
    const f = fixture();
    let uri = "file:///workspace/first.ts";
    const getter = vi.fn(() => uri);
    const item = Object.defineProperty({}, "uri", { get: getter, enumerable: true }) as Row;
    const list = [item];
    expect(f.select(list)).toEqual([uri]);
    uri = "file:///workspace/second.ts";
    expect(f.select(list)).toEqual([uri]);
    expect(getter).toHaveBeenCalledTimes(2);

    const plain = row("plain.ts"), slot = vi.fn(() => plain);
    const slots: Row[] = [];
    Object.defineProperty(slots, 0, { get: slot, enumerable: true });
    f.select(slots); f.select(slots);
    expect(slot).toHaveBeenCalledTimes(2);
  });

  it("keeps missing lists, sparse arrays, inherited URI fields, and malformed rows on the native path", () => {
    const f = fixture();
    expect(f.candidate.selector(undefined, undefined)).toEqual([]);
    f.compare(); f.compare([]);
    const sparse = [row("first.ts"), , row("last.ts")] as Row[];
    f.compare(sparse);
    const inherited = Object.create({ uri: "file:///workspace/inherited.ts" });
    f.compare([inherited]);
    inherited.uri = "file:///workspace/changed.ts";
    f.compare([inherited]);
    expect(() => f.select([null as unknown as Row])).toThrow();
  });

  it("does not reuse paths for mutable object workspaces", () => {
    const f = fixture();
    let base = "https://first.example/";
    const workspace = { toString: () => base };
    const list = [{ uri: "./file.ts" }];
    const first = f.compare(list, workspace);
    base = "https://second.example/";
    expect(f.compare(list, workspace)).not.toEqual(first);
  });

  it("rebuilds results that a consumer has mutated", () => {
    const f = fixture();
    const list = [row("first.ts"), row("second.ts")];
    const first = f.select(list);
    first[0] = "changed externally";
    expect(f.compare(list)).not.toBe(first);
    const second = f.select(list);
    second.pop();
    f.compare(list);
  });

  it("bounds retained projections to four and preserves recently reused entries", () => {
    const f = fixture();
    const lists = Array.from({ length: 5 }, (_, index) => [row(`${index}.ts`)]);
    for (let index = 0; index < 4; index++) f.select(lists[index]);
    f.select(lists[0]);
    f.select(lists[4]);
    f.normalize.mockClear();
    f.select(lists[0]);
    expect(f.normalize).not.toHaveBeenCalled();
    f.select(lists[1]);
    expect(f.normalize).toHaveBeenCalledTimes(1);
  });

  it("also bounds total retained path counts and leaves oversized lists uncached", () => {
    const f = fixture();
    const lists = Array.from({ length: 3 }, (_, list) => Array.from({ length: 4096 }, (_, index) => row(`${list}-${index}.ts`)));
    for (const list of lists) f.select(list);
    f.normalize.mockClear();
    f.select(lists[1]);
    expect(f.normalize).not.toHaveBeenCalled();
    f.select(lists[0]);
    expect(f.normalize).toHaveBeenCalledTimes(4096);
    const large = Array.from({ length: 8193 }, (_, index) => row(`large-${index}.ts`));
    f.select(large);
    f.normalize.mockClear();
    f.select(large);
    expect(f.normalize).toHaveBeenCalledTimes(8193);
  });

  it("fails closed when the native selector changes and matches renamed symbols", () => {
    const changed = nativeSource.replace("c!==null", "c!=null");
    const failure = fixture(changed).result;
    expect(failure.failures).toHaveLength(1);
    expect(failure.source).toBe(changed);
    const renamed = nativeSource.replace(/\bgca\b/g, "fileUris").replace(/\bfh\b/g, "normalizeUri").replace(/\blh\b/g, "readDiffs");
    const result = applySourcePatches(renamed, [{ pluginId: "gemini-app", patches: [patch] }]);
    expect(result.failures).toEqual([]);
    expect(() => new Function(result.source)).not.toThrow();
    expect(result.source).toContain("normalizeUri(c.uri,b)");
  });
});
