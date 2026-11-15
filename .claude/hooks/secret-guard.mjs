// PreToolUse: keep the TMDB key (in .env.local) out of Claude's context and out of output.
// To check that the key isn't committed, run `node .claude/hooks/scan-secrets.mjs` instead.
import { basename } from "node:path";
import { decide, readInput } from "./lib.mjs";

const input = readInput();
const tool = input.tool_name ?? "";
const params = input.tool_input ?? {};

/** .env, .env.local, .env.production… but not the committed .env.example template. */
const isSecretEnvFile = (path) => {
  const name = basename(String(path));
  return /^\.env(\..+)?$/.test(name) && name !== ".env.example";
};

if (["Read", "Edit", "Write", "MultiEdit", "NotebookEdit", "Grep", "Glob"].includes(tool)) {
  const paths = [params.file_path, params.path, params.notebook_path].filter(Boolean);
  if (paths.some(isSecretEnvFile)) {
    decide("deny", "Secret env files (.env.local etc.) are off-limits: they hold the TMDB key.");
  }
}

if (tool === "Bash" || tool === "PowerShell") {
  const command = String(params.command ?? "");
  const mentionsEnvFile = /(^|[\s"'/\\=<>(])\.env(\.(?!example\b)[\w.-]+)?(?=$|[\s"'|;&)<>])/.test(
    command,
  );
  const expandsKey =
    /\$\{?TMDB_API_KEY|\$env:TMDB_API_KEY|\bprintenv\b|\benv\s*$|Get-ChildItem\s+env:|\bdir\s+env:/i.test(
      command,
    );
  if (mentionsEnvFile || expandsKey) {
    decide(
      "deny",
      "This command would read .env files or print environment secrets (the TMDB key). " +
        "Use `node .claude/hooks/scan-secrets.mjs` to check for leaks, and the app's " +
        "/api/tmdb proxy (or the running dev server) to call TMDB.",
    );
  }
}
process.exit(0);
