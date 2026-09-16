import path from "node:path";
import { describe, expect, it } from "vitest";
import { installationPaths, isAntigravityIde, unpackedPath } from "../src/native/paths.js";

describe("installationPaths", () => {
  const paths = installationPaths(path.join("C:", "Apps", "Antigravity"));

  it("keeps the original bundle beside the live one", () => {
    expect(path.basename(paths.currentAsar)).toBe("app.asar");
    expect(path.basename(paths.originalAsar)).toBe("_app.asar");
    expect(path.dirname(paths.originalAsar)).toBe(path.dirname(paths.currentAsar));
  });

  it("stages replacements outside the live path so a crash cannot half-write it", () => {
    expect(paths.stagedAsar).not.toBe(paths.currentAsar);
    expect(paths.stagedAsar.endsWith(".asar")).toBe(false);
  });

  it("keeps runtime code and backups under one directory", () => {
    expect(paths.runtimeCode.startsWith(paths.runtimeRoot)).toBe(true);
    expect(paths.backups.startsWith(paths.runtimeRoot)).toBe(true);
  });

  it("resolves macOS application bundle layouts inside Contents", () => {
    const macPaths = installationPaths(path.join("/", "Applications", "Antigravity.app"));
    expect(macPaths.resources).toBe(path.join("/", "Applications", "Antigravity.app", "Contents", "Resources"));
    expect(macPaths.executable).toBe(path.join("/", "Applications", "Antigravity.app", "Contents", "MacOS", "Antigravity"));
    expect(path.basename(macPaths.currentAsar)).toBe("app.asar");
    expect(macPaths.currentAsar).toBe(path.join(macPaths.resources, "app.asar"));
    expect(macPaths.originalAsar).toBe(path.join(macPaths.resources, "_app.asar"));
    expect(macPaths.runtimeRoot).toBe(path.join(macPaths.resources, ".bettergravity"));
  });

  it("normalizes nested Contents or Resources paths for macOS bundles", () => {
    const bundle = path.join("/", "Applications", "Antigravity.app");
    const fromContents = installationPaths(path.join(bundle, "Contents"));
    const fromResources = installationPaths(path.join(bundle, "Contents", "Resources"));

    expect(fromContents.root).toBe(bundle);
    expect(fromContents.resources).toBe(path.join(bundle, "Contents", "Resources"));
    expect(fromResources.root).toBe(bundle);
    expect(fromResources.resources).toBe(path.join(bundle, "Contents", "Resources"));
  });

  it("resolves Linux installation layouts under resources", () => {
    const linuxPaths = installationPaths(path.join("/", "opt", "Antigravity"));
    expect(linuxPaths.root).toBe(path.join("/", "opt", "Antigravity"));
    expect(linuxPaths.resources).toBe(path.join("/", "opt", "Antigravity", "resources"));
    expect(linuxPaths.executable).toBe(path.join("/", "opt", "Antigravity", "antigravity"));
    expect(path.basename(linuxPaths.currentAsar)).toBe("app.asar");
    expect(linuxPaths.currentAsar).toBe(path.join(linuxPaths.resources, "app.asar"));
    expect(linuxPaths.originalAsar).toBe(path.join(linuxPaths.resources, "_app.asar"));
    expect(linuxPaths.runtimeRoot).toBe(path.join(linuxPaths.resources, ".bettergravity"));
  });

  it("normalizes user selections pointing directly to the Linux binary or resources", () => {
    const root = path.join("/", "opt", "Antigravity");
    const fromBinary = installationPaths(path.join(root, "antigravity"));
    const fromResources = installationPaths(path.join(root, "resources"));

    expect(fromBinary.root).toBe(root);
    expect(fromBinary.resources).toBe(path.join(root, "resources"));
    expect(fromResources.root).toBe(root);
    expect(fromResources.resources).toBe(path.join(root, "resources"));
  });

  it("normalizes user selections pointing directly to Antigravity.exe on Windows including non-ASCII paths", () => {
    const root = path.join("C:", "Users", "Hernán", "AppData", "Local", "Programs", "Antigravity");
    const fromExe = installationPaths(path.join(root, "Antigravity.exe"));
    expect(fromExe.root).toBe(root);
    expect(fromExe.resources).toBe(path.join(root, "resources"));
    expect(fromExe.executable).toBe(path.join(root, "Antigravity.exe"));
  });
});

// Regression: the patcher reads through original-fs, which cannot see inside an
// asar archive, so a packaged installer could not find its own runtime files.
describe("unpackedPath", () => {
  it("redirects a packaged path to the unpacked directory", () => {
    const packaged = path.join("C:", "app", "resources", "app.asar", "dist-electron");
    expect(unpackedPath(packaged)).toBe(path.join("C:", "app", "resources", "app.asar.unpacked", "dist-electron"));
  });

  it("leaves a development path untouched", () => {
    const development = path.join("C:", "repo", "apps", "installer", "dist-electron");
    expect(unpackedPath(development)).toBe(development);
  });

  it("does not rewrite a directory that merely ends in app.asar", () => {
    const target = path.join("C:", "somewhere", "app.asar");
    expect(unpackedPath(target)).toBe(target);
  });

  it("is idempotent", () => {
    const packaged = path.join("C:", "app", "resources", "app.asar", "dist-electron");
    expect(unpackedPath(unpackedPath(packaged))).toBe(unpackedPath(packaged));
  });
});

describe("isAntigravityIde", () => {
  it("identifies Antigravity IDE directory and executable names", () => {
    expect(isAntigravityIde("C:/Users/Lenovo/AppData/Local/Programs/Antigravity IDE")).toBe(true);
    expect(isAntigravityIde("C:/Users/Lenovo/AppData/Local/Programs/Antigravity IDE/Antigravity IDE.exe")).toBe(true);
    expect(isAntigravityIde("C:\\Users\\Lenovo\\AppData\\Local\\Programs\\Antigravity IDE\\Antigravity IDE.exe")).toBe(true);
  });

  it("does not flag standard Antigravity installations as IDE", () => {
    expect(isAntigravityIde("C:/Users/Hernán/AppData/Local/Programs/Antigravity")).toBe(false);
    expect(isAntigravityIde("C:/Users/Hernán/AppData/Local/Programs/Antigravity/Antigravity.exe")).toBe(false);
    expect(isAntigravityIde("/Applications/Antigravity.app")).toBe(false);
    expect(isAntigravityIde("/opt/Antigravity")).toBe(false);
  });
});
