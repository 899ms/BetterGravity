import { execSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const workspace = resolve(import.meta.dirname, "..");
const outDir = resolve(workspace, "dist-native");
const linuxDir = resolve(workspace, "apps", "installer-linux");
const stageDir = resolve(outDir, "bettergravity-installer-linux");

mkdirSync(outDir, { recursive: true });
rmSync(stageDir, { recursive: true, force: true });
mkdirSync(stageDir, { recursive: true });

// 1. Copy Linux installer files to staging directory
cpSync(linuxDir, stageDir, { recursive: true });

// Ensure scripts are executable if on POSIX
try {
  execSync(`chmod +x "${resolve(stageDir, "install.sh")}" "${resolve(stageDir, "bettergravity-installer.py")}"`);
} catch {}

// 2. Package into tar.gz
const tarDest = resolve(outDir, "BetterGravity-Installer-Linux.tar.gz");
execSync(`tar -czf "${tarDest}" -C "${outDir}" bettergravity-installer-linux`, {
  cwd: workspace,
  stdio: "inherit"
});

// Clean up staging directory
rmSync(stageDir, { recursive: true, force: true });
