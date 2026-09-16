import path from "node:path";
import { fs } from "./fs.js";

export interface InstallationPaths {
  readonly root: string;
  readonly executable: string;
  readonly resources: string;
  /** The live bundle Electron boots. Holds the BetterGravity bootstrap once patched. */
  readonly currentAsar: string;
  /** Antigravity's untouched bundle, moved aside during patching. */
  readonly originalAsar: string;
  readonly stagedAsar: string;
  readonly runtimeRoot: string;
  readonly runtimeCode: string;
  readonly backups: string;
}

export const RUNTIME_DIRECTORY_NAME = ".bettergravity";
export const MARKER_NAME = ".bettergravity.json";

export function isAntigravityIde(targetRoot: string): boolean {
  if (!targetRoot) return false;
  const normalized = targetRoot.replace(/\\/g, "/").trim().replace(/\/+$/, "");
  const baseLower = path.basename(normalized).toLowerCase();
  if (baseLower === "antigravity ide.exe" || baseLower === "antigravity ide") return true;

  if (
    fs.existsSync(path.join(normalized, "Antigravity IDE.exe")) ||
    fs.existsSync(path.join(normalized, "antigravity ide.exe"))
  ) {
    return true;
  }

  const sub = path.join(normalized, "Antigravity IDE");
  if (
    fs.existsSync(path.join(sub, "Antigravity IDE.exe")) ||
    fs.existsSync(path.join(sub, "antigravity ide.exe"))
  ) {
    return true;
  }

  return false;
}

function normalizeRoot(root: string): string {
  let normalized = path.normalize(root);
  try {
    if (fs.existsSync(normalized)) {
      const lstat = fs.lstatSync(normalized);
      if (lstat.isSymbolicLink()) {
        normalized = fs.realpathSync(normalized);
      }
      if (fs.statSync(normalized).isFile()) {
        return path.dirname(normalized);
      }
    }
  } catch {
    // If lstat / stat fails, continue
  }

  const base = path.basename(normalized);
  const baseLower = base.toLowerCase();

  // If the user selected the binary directly
  if (baseLower === "antigravity.exe") {
    return path.dirname(normalized);
  }
  if (baseLower === "antigravity" && path.basename(path.dirname(normalized)).toLowerCase() === "antigravity") {
    return path.dirname(normalized);
  }

  if (baseLower === "resources") {
    const parent = path.dirname(normalized);
    if (path.basename(parent) === "Contents") {
      return path.dirname(parent);
    }
    return parent;
  }
  if (base === "Contents") {
    return path.dirname(normalized);
  }

  // If the user selected a directory that contains an "Antigravity" folder
  if (!fs.existsSync(path.join(normalized, "Antigravity.exe")) && !fs.existsSync(path.join(normalized, "antigravity.exe"))) {
    const subFolder = path.join(normalized, "Antigravity");
    if (fs.existsSync(path.join(subFolder, "Antigravity.exe")) || fs.existsSync(path.join(subFolder, "antigravity.exe"))) {
      return subFolder;
    }
  }

  return normalized;
}

function isMacAppBundle(root: string): boolean {
  return root.endsWith(".app") || fs.existsSync(path.join(root, "Contents", "Resources"));
}

function resolveExecutable(root: string, isMac: boolean): string {
  if (isMac) {
    return path.join(root, "Contents", "MacOS", "Antigravity");
  }

  const isWindows = process.platform === "win32" || /^[a-zA-Z]:[\\/]/.test(root);

  if (isWindows) {
    if (fs.existsSync(path.join(root, "Antigravity.exe"))) {
      return path.join(root, "Antigravity.exe");
    }
    if (fs.existsSync(path.join(root, "antigravity.exe"))) {
      return path.join(root, "antigravity.exe");
    }
    if (fs.existsSync(path.join(root, "antigravity"))) {
      return path.join(root, "antigravity");
    }
    if (fs.existsSync(path.join(root, "Antigravity"))) {
      return path.join(root, "Antigravity");
    }
    if (root.startsWith("/") || root.startsWith("\\opt") || root.startsWith("/opt")) {
      return path.join(root, "antigravity");
    }
    return path.join(root, "Antigravity.exe");
  }

  // Linux and other POSIX
  if (fs.existsSync(path.join(root, "antigravity"))) {
    return path.join(root, "antigravity");
  }
  if (fs.existsSync(path.join(root, "Antigravity"))) {
    return path.join(root, "Antigravity");
  }
  if (fs.existsSync(path.join(root, "Antigravity.exe"))) {
    return path.join(root, "Antigravity.exe");
  }
  return path.join(root, "antigravity");
}

export function installationPaths(targetRoot: string): InstallationPaths {
  const root = normalizeRoot(targetRoot);
  const isMac = isMacAppBundle(root);
  const resources = isMac ? path.join(root, "Contents", "Resources") : path.join(root, "resources");
  const executable = resolveExecutable(root, isMac);
  const runtimeRoot = path.join(resources, RUNTIME_DIRECTORY_NAME);
  return {
    root,
    executable,
    resources,
    currentAsar: path.join(resources, "app.asar"),
    originalAsar: path.join(resources, "_app.asar"),
    stagedAsar: path.join(resources, "app.asar.bettergravity-staged"),
    runtimeRoot,
    runtimeCode: path.join(runtimeRoot, "runtime"),
    backups: path.join(runtimeRoot, "backups")
  };
}

function candidateRoots(): readonly string[] {
  if (process.platform === "darwin") {
    const home = process.env.HOME;
    return [
      "/Applications/Antigravity.app",
      home && path.join(home, "Applications", "Antigravity.app")
    ].filter((candidate): candidate is string => typeof candidate === "string");
  }

  if (process.platform === "linux") {
    const home = process.env.HOME;
    return [
      "/opt/Antigravity",
      "/opt/antigravity",
      "/usr/lib/antigravity",
      "/usr/share/antigravity",
      home && path.join(home, ".local", "share", "Antigravity"),
      home && path.join(home, ".local", "share", "antigravity"),
      home && path.join(home, ".local", "share", "programs", "Antigravity")
    ].filter((candidate): candidate is string => typeof candidate === "string");
  }

  const { LOCALAPPDATA, ProgramFiles, APPDATA, USERPROFILE } = process.env;
  const programFilesX86 = process.env["ProgramFiles(x86)"];
  return [
    LOCALAPPDATA && path.join(LOCALAPPDATA, "Programs", "Antigravity"),
    LOCALAPPDATA && path.join(LOCALAPPDATA, "Antigravity"),
    ProgramFiles && path.join(ProgramFiles, "Antigravity"),
    programFilesX86 && path.join(programFilesX86, "Antigravity"),
    APPDATA && path.join(APPDATA, "Programs", "Antigravity"),
    USERPROFILE && path.join(USERPROFILE, "AppData", "Local", "Programs", "Antigravity"),
    USERPROFILE && path.join(USERPROFILE, "AppData", "Local", "Antigravity")
  ].filter((candidate): candidate is string => typeof candidate === "string");
}

export function findAntigravityInstallation(): string | undefined {
  const direct = candidateRoots().find((candidate) => fs.existsSync(installationPaths(candidate).executable));
  if (direct) return direct;

  if (process.platform === "linux") {
    const symlinkCandidate = "/usr/bin/antigravity";
    if (fs.existsSync(symlinkCandidate)) {
      try {
        const resolved = normalizeRoot(symlinkCandidate);
        if (fs.existsSync(installationPaths(resolved).executable)) {
          return resolved;
        }
      } catch {
        // Fall through
      }
    }
  }

  return undefined;
}

/**
 * Rewrites a path inside a packaged `app.asar` to its unpacked twin.
 *
 * The patcher reads and writes through `original-fs`, which has no idea that
 * asar archives can be browsed as directories, so files it needs must exist as
 * real files. electron-builder is told to unpack the runtime, and this maps the
 * path to where they actually land. Outside a packaged app there is no
 * `app.asar` segment and the path is returned unchanged.
 */
export function unpackedPath(target: string): string {
  const packaged = `app.asar${path.sep}`;
  return target.includes(packaged) ? target.replace(packaged, `app.asar.unpacked${path.sep}`) : target;
}
