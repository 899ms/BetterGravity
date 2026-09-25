import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { logger } from "./logger.js";

const RUNTIME_FILES = ["main.cjs", "preload.cjs", "repair.cjs", "overlay.html"] as const;

/**
 * Antigravity updates itself with electron-updater, which replaces app.asar
 * during an install that runs only after the application has quit. By then
 * BetterGravity is gone, because the bootstrap it lived in was the file that
 * got replaced, so nothing inside Antigravity can put it back.
 *
 * The answer is to hand the job to a process that outlives the application:
 * before quitting, spawn a detached guardian that waits for Antigravity to
 * exit, watches for the bundle to come back unpatched, and reapplies the patch.
 */
export function spawnGuardian(runtimeCodeDirectory: string, logFile: string): boolean {
  const script = path.join(runtimeCodeDirectory, "repair.cjs");
  if (!fs.existsSync(script)) {
    logger.error(`The update guardian is missing at ${script}.`);
    return false;
  }

  // resources/.bettergravity/runtime -> the installation root.
  // On macOS, resources is inside Contents/Resources, so 3 levels up is Contents.
  let installationPath = path.resolve(runtimeCodeDirectory, "..", "..", "..");
  if (path.basename(installationPath) === "Contents") {
    installationPath = path.dirname(installationPath);
  }

  const recoveryDir = path.join(path.dirname(logFile), "recovery");
  try {
    fs.mkdirSync(recoveryDir, { recursive: true });
    for (const file of RUNTIME_FILES) {
      const src = path.join(runtimeCodeDirectory, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(recoveryDir, file));
      }
    }
    const markerFile = path.join(recoveryDir, "guardian-pending.json");
    fs.writeFileSync(markerFile, JSON.stringify({ installationPath, timestamp: Date.now() }), "utf8");
  } catch (error) {
    logger.error("Could not stage recovery runtime files for guardian.", error);
  }

  const recoveryScript = path.join(recoveryDir, "repair.cjs");
  const launchScript = fs.existsSync(recoveryScript) ? recoveryScript : script;

  try {
    const child = spawn(process.execPath, [launchScript, installationPath, logFile, recoveryDir], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
      // Runs the Electron binary as a plain Node process, which is how the
      // guardian gets a runtime without Antigravity needing to be installed.
      env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" }
    });
    child.unref();
    logger.info(`Update guardian started for ${installationPath}.`);
    return true;
  } catch (error) {
    logger.error("Could not start the update guardian.", error);
    return false;
  }
}
