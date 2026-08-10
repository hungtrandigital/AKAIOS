import { readdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { Miniflare } from "miniflare";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stateRoot = path.join(projectRoot, ".wrangler", "state", "v3");
const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const host = process.env.HOST ?? "0.0.0.0";
const serverRoot = path.join(projectRoot, "dist", "server");

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PORT value: ${process.env.PORT}`);
}

function listWorkerModules(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listWorkerModules(entryPath);
    if (!entry.isFile() || !/\.m?js$/.test(entry.name)) return [];
    return [{ type: "ESModule", path: entryPath }];
  });
}

const workerEntryPath = path.join(serverRoot, "index.js");
const workerModules = listWorkerModules(serverRoot);
workerModules.sort((left, right) => {
  if (left.path === workerEntryPath) return -1;
  if (right.path === workerEntryPath) return 1;
  return left.path.localeCompare(right.path);
});

const runtime = new Miniflare({
  rootPath: projectRoot,
  host,
  port,
  modules: workerModules,
  modulesRoot: serverRoot,
  compatibilityDate: "2026-05-22",
  compatibilityFlags: ["nodejs_compat"],
  bindings: {
    ADMIN_PREVIEW_PASSWORD: process.env.ADMIN_PREVIEW_PASSWORD ?? "",
  },
  assets: {
    directory: "dist/client",
    routerConfig: {
      has_user_worker: true,
    },
  },
  d1Databases: {
    DB: "00000000-0000-4000-8000-000000000000",
  },
  d1Persist: path.join(stateRoot, "d1"),
  r2Buckets: {
    MEDIA: "akaiunsan-corporate-media-local",
  },
  r2Persist: path.join(stateRoot, "r2"),
});

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[production] Received ${signal}; stopping workerd.`);

  const forceExit = setTimeout(() => process.exit(1), 10_000);
  forceExit.unref();

  try {
    await runtime.dispose();
    process.exit(0);
  } catch (error) {
    console.error("[production] Failed to stop workerd cleanly:", error);
    process.exit(1);
  }
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

try {
  const url = await runtime.ready;
  const readinessResponse = await runtime.dispatchFetch("http://localhost/");
  if (!readinessResponse.ok) {
    const body = (await readinessResponse.text()).slice(0, 200);
    throw new Error(
      `Startup readiness check returned HTTP ${readinessResponse.status}${body ? `: ${body}` : ""}`,
    );
  }
  await readinessResponse.body?.cancel();
  console.log(`[production] AKAIUNSAN worker listening at ${url.toString()}`);
} catch (error) {
  console.error("[production] Unable to start workerd:", error);
  await runtime.dispose().catch(() => {});
  process.exit(1);
}
