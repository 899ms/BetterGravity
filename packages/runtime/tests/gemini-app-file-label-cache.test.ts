import { readFileSync } from "node:fs";
import { win32 } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { applySourcePatches, readPatches } from "../src/main/source-patch.js";

const manifest = JSON.parse(readFileSync("community/plugins/gemini-app/plugin.json", "utf8"));
const patch = readPatches("gemini-app", manifest)!.patches.find(p => p.find === "synthesizedRelevantOptions")!;
const nativeSource = `/* synthesizedRelevantOptions */
var q6a=()=>{var a=XM(),b=eQ(a),c=ZL(),e=o6a(),f=zM(),g=(0,z.useMemo)(()=>{if(c&&f)return Yn({cascadeId:c,sectionId:f})},[c,f]),h=En(m=>Hla(m,g)),k=bz(c),l=cl(k,gca,a?a:void 0);return(0,z.useMemo)(()=>{var m=new Set;for(let n of h)m.add(n);for(let n of l)m.add(n);return Array.from(m).map(n=>{if(e(n))n=m6a(n);else{var p=ds(n);let r=b.length===1?Twa(ds(b[0]),p)??p.path:p.path;p=ns(p);n={type:"basic",item:{id:n,label:p,icon:z.createElement(dQ,{uri:n,size:20,isDirectory:null}),description:Sr(r),descriptionOrientation:"horizontal",
path:r}}}return n})},[h,l,b,e])};`;
type Uri = { path: string; authority: string };
type Suggestion = { type: string; item: { id: string; label: string; path?: string; description?: string; icon: { type: unknown; props: object; owner: object } } };

function fixture(source = nativeSource) {
  const result = applySourcePatches(source, [{ pluginId: "gemini-app", patches: [patch] }]);
  if (source === nativeSource) expect(result.failures).toEqual([]);
  let folders = ["file:///workspace/"], known: string[] = [], changed: string[] = [];
  let knowledge = new Set<string>(), owner = {};
  const classify = vi.fn((uri: string) => knowledge.has(uri));
  const parse = vi.fn((uri: string): Uri => {
    if (uri === "invalid") throw new Error("invalid URI");
    const value = new URL(uri);
    return { path: decodeURIComponent(value.pathname), authority: value.host };
  });
  const memo = vi.fn((build: () => unknown, _dependencies: unknown[]) => build());
  const createElement = (type: unknown, props: object) => ({ type, props, owner });
  const iconType = () => null;
  const dependencies = {
    z: { useMemo: memo, createElement }, XM: () => "file:///workspace/", eQ: () => folders,
    ZL: () => "conversation", o6a: () => classify, zM: () => "section", Yn: () => "section-key",
    En: () => known, Hla: () => known, bz: () => "provider", cl: () => changed, gca: {},
    ds: parse, Twa: (base: Uri, uri: Uri) => base.authority === uri.authority ? win32.relative(base.path, uri.path) : undefined,
    ns: (uri: Uri) => win32.basename(uri.path), Sr: win32.dirname, dQ: iconType,
    m6a: (uri: string) => ({ type: "basic", item: { id: uri, label: "Knowledge", icon: createElement("knowledge", { uri }) } })
  };
  const compile = (code: string) => new Function(...Object.keys(dependencies), `${code}\nreturn q6a;`)(...Object.values(dependencies));
  const native = compile(nativeSource), candidate = compile(result.source);
  return {
    native, candidate, result, parse, memo, classify, iconType,
    setFolders: (value: string[]) => { folders = value; },
    setKnown: (value: string[]) => { known = value; },
    setChanged: (value: string[]) => { changed = value; },
    setKnowledge: (value: string[]) => { knowledge = new Set(value); },
    setOwner: (value: object) => { owner = value; },
    compare(): Suggestion[] { const value = candidate(); expect(value).toEqual(native()); return value; }
  };
}

const uri = (name: string) => `file:///workspace/${name}`;

describe("Gemini App file suggestion labels", () => {
  it("reuses unchanged path text across renders and keeps the native union order", () => {
    const f = fixture();
    f.setKnown([uri("a.ts"), uri("b.ts")]);
    f.setChanged([uri("b.ts"), uri("folder/c.ts")]);
    const first = f.compare();
    expect(first.map(row => row.item.id)).toEqual([uri("a.ts"), uri("b.ts"), uri("folder/c.ts")]);
    f.parse.mockClear();
    for (let i = 0; i < 20; i++) {
      f.setFolders(["file:///workspace/"]);
      expect(f.candidate()).toEqual(first);
    }
    expect(f.parse).not.toHaveBeenCalled();
    f.setKnown([uri("b.ts")]);
    f.setChanged([uri("new.ts"), uri("a.ts")]);
    expect(f.compare().map(row => row.item.id)).toEqual([uri("b.ts"), uri("new.ts"), uri("a.ts")]);
  });

  it("keeps React icons fresh and never caches their previous render owner", () => {
    const f = fixture();
    f.setChanged([uri("file.ts")]);
    const firstOwner = {}, secondOwner = {};
    f.setOwner(firstOwner);
    const first = f.candidate()[0].item;
    f.setOwner(secondOwner);
    const second = f.candidate()[0].item;
    expect(second.icon).not.toBe(first.icon);
    expect(second.icon.owner).toBe(secondOwner);
    expect(second.icon.type).toBe(f.iconType);
    expect(second.icon.props).toEqual({ uri: uri("file.ts"), size: 20, isDirectory: null });
    expect(second.label).toBe(first.label);
    expect(second.path).toBe(first.path);
  });

  it("keeps knowledge classification live even when its callback identity stays the same", () => {
    const f = fixture();
    f.setChanged([uri("file.ts")]);
    f.compare();
    f.setKnowledge([uri("file.ts")]);
    expect(f.compare()[0]!.item.label).toBe("Knowledge");
    f.setKnowledge([]);
    expect(f.compare()[0]!.item.label).toBe("file.ts");
    expect(f.classify).toHaveBeenCalledTimes(6);
  });

  it("refreshes relative paths for folder changes and preserves the absolute-path branches", () => {
    const f = fixture();
    const folders = ["file:///workspace/"];
    f.setFolders(folders);
    f.setChanged([uri("nested/file%20name.ts"), "https://other.example/different.ts"]);
    const first = f.compare();
    folders[0] = "file:///workspace/nested/";
    const second = f.compare();
    expect(second[0]!.item.path).not.toBe(first[0]!.item.path);
    expect(second[0]!.item.label).toBe("file name.ts");
    f.setFolders([]);
    const absolute = f.compare();
    f.setFolders(["file:///one/", "file:///two/"]);
    expect(f.compare()).toEqual(absolute);
    f.setFolders(["file:///third/"]);
    f.compare();
  });

  it("preserves native failures and does not invoke folder accessors while checking cache keys", () => {
    const f = fixture();
    f.setChanged([uri("file.ts")]);
    const folders: string[] = [];
    const getter = vi.fn(() => "file:///workspace/");
    Object.defineProperty(folders, 0, { get: getter, enumerable: true });
    f.setFolders(folders);
    f.candidate(); f.candidate();
    expect(getter).toHaveBeenCalledTimes(2);
    f.setChanged(["invalid"]);
    expect(() => f.candidate()).toThrow("invalid URI");
    expect(() => f.candidate()).toThrow("invalid URI");
    f.setChanged([]);
    expect(f.candidate()).toEqual([]);
  });

  it("bounds cached file entries and allows evicted paths to be recomputed", () => {
    const f = fixture();
    const names = Array.from({ length: 4097 }, (_, index) => uri(`file-${index}.ts`));
    f.setChanged(names);
    f.candidate();
    f.parse.mockClear();
    f.setChanged([names[4096]!]); f.candidate();
    expect(f.parse).not.toHaveBeenCalled();
    f.setChanged([names[0]!]); f.candidate();
    expect(f.parse).toHaveBeenCalledTimes(2);
  });

  it("bounds retained string sizes as well as entry counts", () => {
    const f = fixture();
    const names = [uri("a".repeat(200_000)), uri("b".repeat(200_000))];
    for (const name of names) { f.setChanged([name]); f.candidate(); }
    f.parse.mockClear();
    f.setChanged([names[0]!]); f.candidate();
    expect(f.parse).toHaveBeenCalledTimes(2);
  });

  it("preserves hook count and dependency values", () => {
    const f = fixture();
    f.setChanged([uri("file.ts")]);
    f.native();
    const nativeDependencies = f.memo.mock.calls.map(([, dependencies]) => dependencies);
    f.memo.mockClear();
    f.candidate();
    expect(f.memo.mock.calls.map(([, dependencies]) => dependencies)).toEqual(nativeDependencies);
  });

  it("keeps a changed native hook intact and handles renamed native symbols", () => {
    const changed = nativeSource.replace('descriptionOrientation:"horizontal"', 'descriptionOrientation:"vertical"');
    const failure = fixture(changed).result;
    expect(failure.failures).toHaveLength(1);
    expect(failure.source).toBe(changed);
    const renamed = nativeSource.replace(/\bq6a\b/g, "suggestions").replace(/\bz\b/g, "React").replace(/\bds\b/g, "parseUri");
    const result = applySourcePatches(renamed, [{ pluginId: "gemini-app", patches: [patch] }]);
    expect(result.failures).toEqual([]);
    expect(() => new Function(result.source)).not.toThrow();
    expect(result.source).toContain("React.createElement");
    expect(result.source).toContain("parseUri");
  });
});
