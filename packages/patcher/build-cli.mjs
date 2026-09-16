import { build } from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

await build({
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node18",
  entryPoints: [path.join(here, "src", "native", "cli.ts")],
  outfile: path.join(here, "dist", "native", "patcher-cli.cjs"),
  external: ["electron", "original-fs"],
  logOverride: {
    "empty-import-meta": "silent"
  },
  logLevel: "warning"
});

console.log("Patcher standalone CLI built to dist/native/patcher-cli.cjs");
