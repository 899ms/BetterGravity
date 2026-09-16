import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const workspace = resolve(import.meta.dirname, "..");
const outDir = resolve(workspace, "dist-native");
const winPublishDir = resolve(outDir, "windows-publish");
const lightPublishDir = resolve(outDir, "windows-light");

mkdirSync(outDir, { recursive: true });

// Ensure patcher CLI is freshly bundled
execSync("node packages/patcher/build-cli.mjs", { cwd: workspace, stdio: "inherit" });

const patcherCliSrc = resolve(workspace, "packages/patcher/dist/native/patcher-cli.cjs");
const patcherCliDest = resolve(workspace, "apps/installer-windows/Patcher/patcher-cli.cjs");
if (existsSync(patcherCliSrc)) {
  cpSync(patcherCliSrc, patcherCliDest, { force: true });
}

// Ensure runtime bundles are synced to installer-windows Patcher directory
const electronRuntimeSrc = resolve(workspace, "apps/installer/dist-electron/runtime");
const windowsRuntimeDest = resolve(workspace, "apps/installer-windows/Patcher/runtime");
if (existsSync(electronRuntimeSrc)) {
  mkdirSync(windowsRuntimeDest, { recursive: true });
  cpSync(electronRuntimeSrc, windowsRuntimeDest, { recursive: true, force: true });
}

// 1. Build self-contained single-file executable
execSync(
  `dotnet publish apps/installer-windows/BetterGravityInstaller.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:EnableCompressionInSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -o "${winPublishDir}"`,
  { cwd: workspace, stdio: "inherit" }
);

const exeSrc = resolve(winPublishDir, "BetterGravityInstaller.exe");
const exeDest = resolve(outDir, "BetterGravity-Installer-Windows-x64.exe");

if (existsSync(exeSrc)) {
  cpSync(exeSrc, exeDest);
}

// Create standalone zip
const standaloneZip = resolve(outDir, "BetterGravity-Installer-Windows-x64.zip");
execSync(
  `powershell -NoProfile -Command "Compress-Archive -Path '${winPublishDir}\\BetterGravityInstaller.exe' -DestinationPath '${standaloneZip}' -Force"`,
  { cwd: workspace, stdio: "inherit" }
);

// 2. Build lightweight framework-dependent package (<1MB)
execSync(
  `dotnet publish apps/installer-windows/BetterGravityInstaller.csproj -c Release -r win-x64 --self-contained false -o "${lightPublishDir}"`,
  { cwd: workspace, stdio: "inherit" }
);

try {
  rmSync(resolve(lightPublishDir, "BetterGravityInstaller.pdb"), { force: true });
} catch {}

const lightZip = resolve(outDir, "BetterGravity-Installer-Windows-Light.zip");
execSync(
  `powershell -NoProfile -Command "Compress-Archive -Path '${lightPublishDir}\\*' -DestinationPath '${lightZip}' -Force"`,
  { cwd: workspace, stdio: "inherit" }
);

// Clean up intermediate staging directories
rmSync(winPublishDir, { recursive: true, force: true });
rmSync(lightPublishDir, { recursive: true, force: true });
