// Checks that no secret value from .env.local is staged or in tracked files.
// Prints only file names, never the secret. Exit 1 if anything is found.
//   node .claude/hooks/scan-secrets.mjs           → staged + tracked files
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { projectDir, run } from "./lib.mjs";

const envFile = join(projectDir, ".env.local");
if (!existsSync(envFile)) {
  console.log("No .env.local: nothing to scan for.");
  process.exit(0);
}

const secrets = readFileSync(envFile, "utf8")
  .split(/\r?\n/)
  .map((line) => line.match(/^\s*([A-Z0-9_]*(KEY|TOKEN|SECRET)[A-Z0-9_]*)\s*=\s*"?([^"\s]+)"?/))
  .filter((match) => match && match[3].length >= 8)
  .map((match) => ({ name: match[1], value: match[3] }));

const leaks = secrets.flatMap(({ name, value }) =>
  ["--cached", null].flatMap((scope) => {
    const args = ["grep", "-l", "-F", ...(scope ? [scope] : []), "-e", value];
    const result = run("git", args);
    return result.code === 0
      ? result.output
          .split(/\r?\n/)
          .map((file) => `${name} found in ${scope ? "staged " : ""}${file}`)
      : [];
  }),
);

if (leaks.length > 0) {
  console.log([...new Set(leaks)].join("\n"));
  process.exit(1);
}
console.log(
  `OK: none of ${secrets.length} secret(s) from .env.local appear in tracked or staged files.`,
);
