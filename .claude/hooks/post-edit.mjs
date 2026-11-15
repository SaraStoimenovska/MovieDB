// PostToolUse (Edit|Write|MultiEdit): encoding guard, then format + lint the edited file.
// Exit 2 sends the message back to Claude so it fixes the problem right away.
import { existsSync, readFileSync } from "node:fs";
import { extname, relative } from "node:path";
import { projectDir, readInput, run, tail } from "./lib.mjs";

const input = readInput();
const file = input.tool_input?.file_path ?? input.tool_response?.filePath;
if (!file || !existsSync(file)) process.exit(0);

const rel = relative(projectDir, file);
if (rel.startsWith("..") || /(^|[\\/])(node_modules|\.next)[\\/]/.test(rel)) process.exit(0);

const fail = (message) => {
  process.stderr.write(`${message}\n`);
  process.exit(2);
};

// 1. Mojibake: UTF-8 text that was decoded as Windows-1252 somewhere (e.g. PowerShell 5.1
//    Set-Content), plus a UTF-8 BOM. Written with escapes so this file doesn't match itself.
const TEXT = /\.(tsx?|mts|mjs|js|json|css|md|svg|ya?ml)$/i;
if (TEXT.test(file)) {
  const text = readFileSync(file, "utf8");
  if (text.charCodeAt(0) === 0xfeff) {
    fail(`${rel}: starts with a UTF-8 BOM. Rewrite it as UTF-8 without BOM.`);
  }
  const MOJIBAKE = /Ã[\u0080-¿]|â€|â˜|Â[ -¿]|�/;
  const hit = text.match(MOJIBAKE);
  if (hit) {
    const line = text.slice(0, hit.index).split("\n").length;
    fail(
      `${rel}:${line}: broken character encoding ("${hit[0]}"). The file was saved with the wrong ` +
        "encoding: restore the original characters and write files as UTF-8 (no BOM).",
    );
  }
}

// 2. Format + lint (fast: one file; eslint uses its cache).
const ext = extname(file).toLowerCase();
if ([".ts", ".tsx", ".mts"].includes(ext)) {
  const lint = run("pnpm exec eslint --fix --cache --no-warn-ignored", [file]);
  run("pnpm exec prettier --write --log-level warn", [file]);
  if (lint.code !== 0) fail(`ESLint problems left in ${rel}:\n${tail(lint.output)}`);
} else if ([".mjs", ".js", ".json", ".css", ".md", ".yml", ".yaml"].includes(ext)) {
  run("pnpm exec prettier --write --ignore-unknown --log-level warn", [file]);
}
process.exit(0);
