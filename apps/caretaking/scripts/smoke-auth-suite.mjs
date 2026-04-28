import { spawn } from "node:child_process";
import path from "node:path";

import { printHeading } from "./smoke-playwright-utils.mjs";

const scriptDir = path.resolve("scripts");
const scripts = ["smoke-auth-signup-request.mjs", "smoke-auth-generated-link.mjs"];

async function runScript(scriptName) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(scriptDir, scriptName)], {
      cwd: process.cwd(),
      stdio: "inherit",
      env: process.env
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${scriptName} exited with code ${code ?? "unknown"}`));
      }
    });

    child.on("error", reject);
  });
}

async function main() {
  printHeading("Caretaking Auth Smoke Suite");

  for (const script of scripts) {
    await runScript(script);
  }

  console.log("\nAll auth smoke checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
