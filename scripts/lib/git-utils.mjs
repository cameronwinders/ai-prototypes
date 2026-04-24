import { spawnSync } from "node:child_process";

export function runGit(rootDir, args) {
  const result = spawnSync("git", args, {
    cwd: rootDir,
    stdio: "pipe",
    encoding: "utf8"
  });

  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || result.stdout?.trim() || `git ${args.join(" ")} failed`);
  }

  return result.stdout.trim();
}

export function hasGitChanges(rootDir) {
  return runGit(rootDir, ["status", "--short"]).trim().length > 0;
}

export function getCurrentBranch(rootDir) {
  return runGit(rootDir, ["branch", "--show-current"]) || "main";
}

export function commitAndPush(rootDir, message, branch) {
  runGit(rootDir, ["add", "."]);

  if (!hasGitChanges(rootDir)) {
    return;
  }

  runGit(rootDir, ["commit", "-m", message]);
  runGit(rootDir, ["push", "origin", branch]);
}
