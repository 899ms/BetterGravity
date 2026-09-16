import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { InstallOperation, OperationProgress } from "../types.js";
import { findAntigravityInstallation, inspectInstallation, runOperation, uninstall } from "./index.js";

function emit(data: unknown): void {
  process.stdout.write(JSON.stringify(data) + "\n");
}

function getDirname(): string {
  if (typeof __dirname !== "undefined") return __dirname;
  return path.dirname(fileURLToPath(import.meta.url));
}

function isValidRuntimeDir(dir: string): boolean {
  try {
    return fs.existsSync(path.join(dir, "main.cjs"));
  } catch {
    return false;
  }
}

function resolveRuntimeSource(arg?: string): string {
  if (arg) {
    const resolvedArg = path.resolve(arg);
    if (isValidRuntimeDir(resolvedArg)) {
      return resolvedArg;
    }
  }

  const here = getDirname();
  const candidates = [
    arg ? path.resolve(arg) : null,
    path.resolve(here, "runtime"),
    path.resolve(here, "../runtime"),
    path.resolve(here, "../../../../apps/installer/dist-electron/runtime"),
    path.resolve(here, "../../../apps/installer/dist-electron/runtime"),
    path.resolve(here, "../../apps/installer/dist-electron/runtime"),
    path.resolve(here, "../../../../apps/installer-windows/Patcher/runtime"),
    path.resolve(here, "../../../apps/installer-windows/Patcher/runtime"),
    path.resolve(here, "../../../../packages/runtime/dist"),
    path.resolve(here, "../../../packages/runtime/dist"),
    path.resolve(here, "../../runtime/dist")
  ].filter((c): c is string => Boolean(c));

  for (const candidate of candidates) {
    if (isValidRuntimeDir(candidate)) {
      return candidate;
    }
  }

  return arg ? path.resolve(arg) : path.resolve(here, "runtime");
}

export async function runCli(args: string[]): Promise<number> {
  const command = args[0];

  try {
    if (command === "detect") {
      const foundPath = await findAntigravityInstallation();
      emit({ success: true, path: foundPath ?? null });
      return 0;
    }

    if (command === "inspect") {
      const targetPath = args[1];
      if (!targetPath) {
        emit({ success: false, error: "Missing installation path." });
        return 1;
      }
      const state = inspectInstallation(targetPath);
      emit({ success: true, installation: state });
      return 0;
    }

    if (command === "run") {
      const operation = args[1] as InstallOperation;
      const targetPath = args[2];
      const runtimeSource = resolveRuntimeSource(args[3]);

      if (!operation || !targetPath) {
        emit({ type: "result", success: false, message: "Missing operation or target path." });
        return 1;
      }

      const onProgress = (progress: OperationProgress) => {
        emit({ type: "progress", ...progress });
      };

      let result;
      if (operation === "uninstall") {
        result = await uninstall(targetPath, onProgress);
      } else {
        result = await runOperation(operation, targetPath, { runtimeSource }, onProgress);
      }

      emit({ type: "result", success: true, message: result.message, installation: result.installation });
      return 0;
    }

    emit({ success: false, error: `Unknown command: ${command}` });
    return 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    emit({ type: "result", success: false, message });
    return 1;
  }
}

const isMain =
  (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) ||
  (process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("/cli.ts"));

if (isMain) {
  runCli(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
