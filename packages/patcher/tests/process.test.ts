import { describe, expect, it } from "vitest";
import { parseDarwinProcessIds, parsePosixProcessIds, parseProcessIds } from "../src/native/process.js";

describe("parseProcessIds", () => {
  it("reads the ids PowerShell prints, one per line", () => {
    expect(parseProcessIds("1234\r\n5678\r\n")).toEqual([1234, 5678]);
  });

  it("ignores blank lines and stray whitespace", () => {
    expect(parseProcessIds("\n  4242  \n\n")).toEqual([4242]);
  });

  it("ignores anything that is not a process id", () => {
    expect(parseProcessIds("ProcessId\n-----\n99\n0\n-3\n")).toEqual([99]);
  });

  it("returns nothing for empty output", () => {
    expect(parseProcessIds("")).toEqual([]);
  });

  // Regression: the update guardian runs the Antigravity binary as a plain Node
  // process, so it showed up as the very application it was waiting on and
  // would have waited for itself forever.
  it("excludes the ids it is told to ignore", () => {
    expect(parseProcessIds("111\n222\n333\n", [222])).toEqual([111, 333]);
  });

  it("can exclude every match", () => {
    expect(parseProcessIds("111\n", [111])).toEqual([]);
  });
});

describe("parsePosixProcessIds", () => {
  const targetApp = "/Applications/Antigravity.app";
  const psOutput = [
    "  101 /Applications/Antigravity.app/Contents/MacOS/Antigravity",
    "  102 /Applications/Antigravity.app/Contents/Frameworks/Antigravity Helper.app/Contents/MacOS/Antigravity Helper --type=renderer",
    "  201 /usr/libexec/opendirectoryd",
    "  301 /Users/test/Applications/Antigravity.app/Contents/MacOS/Antigravity",
    "  401 /Applications/Antigravity.app/Contents/MacOS/Antigravity --node-guardian"
  ].join("\n");

  it("matches processes running out of the specific app bundle", () => {
    expect(parseDarwinProcessIds(psOutput, targetApp)).toEqual([101, 102, 401]);
    expect(parsePosixProcessIds(psOutput, targetApp)).toEqual([101, 102, 401]);
  });

  it("excludes process ids passed in the exclusion list", () => {
    expect(parsePosixProcessIds(psOutput, targetApp, [401])).toEqual([101, 102]);
  });

  it("ignores unrelated apps and distinct installations elsewhere", () => {
    expect(parsePosixProcessIds(psOutput, "/Users/test/Applications/Antigravity.app")).toEqual([301]);
    expect(parsePosixProcessIds(psOutput, "/Applications/NonExistent.app")).toEqual([]);
  });

  it("returns nothing for empty ps output", () => {
    expect(parsePosixProcessIds("", targetApp)).toEqual([]);
  });

  it("matches Linux processes running from /opt/Antigravity or user home", () => {
    const linuxPsOutput = [
      "  501 /opt/Antigravity/antigravity --enable-features=WaylandWindowDecorations",
      "  502 /opt/Antigravity/antigravity --type=zygote",
      "  503 /opt/Antigravity/antigravity --type=gpu-process",
      "  601 /home/user/.local/share/Antigravity/antigravity",
      "  701 /usr/bin/bash"
    ].join("\n");

    expect(parsePosixProcessIds(linuxPsOutput, "/opt/Antigravity")).toEqual([501, 502, 503]);
    expect(parsePosixProcessIds(linuxPsOutput, "/home/user/.local/share/Antigravity")).toEqual([601]);
  });
});
