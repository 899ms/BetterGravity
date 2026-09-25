import { build } from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

await Promise.all([
  build({
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
  }),
  build({
    bundle: true,
    platform: "node",
    format: "cjs",
    target: "node18",
    entryPoints: [path.join(here, "src", "native", "repair-cli.ts")],
    outfile: path.join(here, "dist", "native", "repair.cjs"),
    external: ["electron", "original-fs"],
    logOverride: {
      "empty-import-meta": "silent"
    },
    logLevel: "warning"
  })
]);

console.log("Patcher standalone CLI and guardian repair.cjs built to dist/native/");
