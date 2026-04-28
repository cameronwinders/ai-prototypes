import path from "node:path";
import { pathToFileURL } from "node:url";

import prototypeConfig from "../prototype.config.json" with { type: "json" };

export function getExpectedBaseUrl() {
  return (process.env.PLAYWRIGHT_BASE_URL ?? prototypeConfig.siteUrl ?? "http://localhost:3000").replace(/\/+$/, "");
}

export function getExpectedAuthCallbackUrl() {
  return `${getExpectedBaseUrl()}/api/auth/callback?next=%2Fspaces`;
}

export async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch (error) {
    const packagePath = process.env.PLAYWRIGHT_PACKAGE_PATH;

    if (packagePath) {
      const packageEntry = pathToFileURL(path.join(packagePath, "index.mjs")).href;
      return import(packageEntry);
    }

    throw new Error(
      "Playwright package not found. Install it locally or set PLAYWRIGHT_PACKAGE_PATH to a Playwright package directory."
    );
  }
}

export function printHeading(title) {
  console.log(`\n=== ${title} ===`);
}

export function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
