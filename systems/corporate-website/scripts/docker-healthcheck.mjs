import { readFile, rm, writeFile } from "node:fs/promises";
import process from "node:process";

const healthUrl = process.env.HEALTHCHECK_URL ?? "http://127.0.0.1:3000/";
const failureFile = "/tmp/akaiunsan-healthcheck-failures";
const configuredRestartAfter = Number.parseInt(
  process.env.HEALTHCHECK_RESTART_AFTER ?? "5",
  10,
);
const restartAfter =
  Number.isSafeInteger(configuredRestartAfter) && configuredRestartAfter > 0
    ? configuredRestartAfter
    : 5;

async function resetFailures() {
  await rm(failureFile, { force: true });
}

async function recordFailure() {
  let failures = 0;

  try {
    failures = Number.parseInt(await readFile(failureFile, "utf8"), 10) || 0;
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  failures += 1;
  await writeFile(failureFile, String(failures), "utf8");
  return failures;
}

try {
  const response = await fetch(healthUrl, {
    signal: AbortSignal.timeout(5_000),
    headers: { "User-Agent": "akaiunsan-docker-healthcheck" },
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  await response.body?.cancel();
  await resetFailures();
  process.exit(0);
} catch (error) {
  const failures = await recordFailure();
  console.error(
    `[healthcheck] ${healthUrl} failed (${failures}/${restartAfter}):`,
    error instanceof Error ? error.message : error,
  );

  if (failures >= restartAfter && process.platform === "linux") {
    console.error("[healthcheck] Failure threshold reached; restarting container.");
    await resetFailures();
    process.kill(1, "SIGTERM");
  }

  process.exit(1);
}
