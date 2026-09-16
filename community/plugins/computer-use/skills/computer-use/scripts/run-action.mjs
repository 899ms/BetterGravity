import http from "node:http";
import path from "node:path";
import os from "node:os";
import { pathToFileURL, fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadRegistryClass() {
  const candidates = [
    path.resolve(__dirname, "../../../tools/index.js"),
    path.resolve(__dirname, "../tools/index.js"),
    path.join(
      process.env.APPDATA || (process.platform === "win32" ? path.join(os.homedir(), "AppData", "Roaming") : path.join(os.homedir(), ".config")),
      "BetterGravity",
      "plugins",
      "computer-use",
      "tools",
      "index.js"
    ),
  ];

  for (const candidate of candidates) {
    try {
      const mod = await import(pathToFileURL(candidate).href);
      if (mod.ComputerUseToolRegistry) {
        return mod.ComputerUseToolRegistry;
      }
    } catch {}
  }
  throw new Error("Could not find ComputerUseToolRegistry in plugin directories.");
}
function notifyBridge(type, data) {
  try {
    const req = http.request({
      hostname: "127.0.0.1",
      port: 51829,
      path: "/event",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      timeout: 300,
    });
    req.on("error", () => {});
    req.write(JSON.stringify({ type, ...data }));
    req.end();
  } catch {}
}

async function main() {
  const args = process.argv.slice(2);
  const toolName = args[0];
  if (!toolName) {
    process.stderr.write("Usage: node run-action.mjs <toolName> [jsonArgs]\n");
    process.exit(1);
  }

  let toolArgs = {};
  if (args[1]) {
    try {
      toolArgs = JSON.parse(args[1]);
    } catch {
      toolArgs = {};
    }
  }

  notifyBridge("tool_start", { toolName, args: toolArgs });

  try {
    const ComputerUseToolRegistry = await loadRegistryClass();
    const registry = new ComputerUseToolRegistry();
    const result = await registry.executeTool(toolName, toolArgs);
    notifyBridge("tool_complete", { toolName, args: toolArgs, result });
    process.stdout.write(typeof result === "string" ? result : JSON.stringify(result, null, 2) + "\n");
  } catch (err) {
    notifyBridge("tool_complete", { toolName, args: toolArgs, error: err.message });
    process.stderr.write(JSON.stringify({ error: err.message }) + "\n");
    process.exit(1);
  }
}

main();
