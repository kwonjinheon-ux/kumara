import { readFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";

const baseUrl = process.env.MARKETPLACE_BASE_URL ?? "http://localhost:3000";
const iterations = Number(process.env.MARKETPLACE_PERF_ITERATIONS ?? 20);
const warmups = Number(process.env.MARKETPLACE_PERF_WARMUPS ?? 3);
const explicitPostUrl = process.env.MARKETPLACE_POST_URL;

async function main() {
  const postUrl = explicitPostUrl ?? `${baseUrl}/marketplace/${await getFirstPostId()}`;

  console.log(`Marketplace perf target: ${baseUrl}`);
  console.log(`Iterations: ${iterations}, warmups: ${warmups}`);

  await runCase("marketplace list", `${baseUrl}/marketplace`);
  await runCase("marketplace detail", postUrl);
}

async function runCase(label, url) {
  for (let index = 0; index < warmups; index += 1) {
    await timeFetch(url);
  }

  const timings = [];

  for (let index = 0; index < iterations; index += 1) {
    timings.push(await timeFetch(url));
  }

  timings.sort((a, b) => a - b);

  const p50 = percentile(timings, 50);
  const p95 = percentile(timings, 95);
  const min = timings[0];
  const max = timings[timings.length - 1];

  console.log(`${label}`);
  console.log(`  url: ${url}`);
  console.log(`  min ${formatMs(min)} | p50 ${formatMs(p50)} | p95 ${formatMs(p95)} | max ${formatMs(max)}`);
}

async function timeFetch(url) {
  const startedAt = performance.now();
  const response = await fetch(url, {
    headers: {
      "User-Agent": "korin-marketplace-perf/1.0",
    },
  });
  await response.arrayBuffer();

  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }

  return performance.now() - startedAt;
}

async function getFirstPostId() {
  const raw = await readFile(new URL("../data/market-posts.json", import.meta.url), "utf8");
  const match = raw.match(/"id":"([^"]+)"/) ?? raw.match(/"id"\s*:\s*"([^"]+)"/);

  if (!match?.[1]) {
    throw new Error("Could not find a marketplace post id. Set MARKETPLACE_POST_URL instead.");
  }

  return match[1];
}

function percentile(values, percentileValue) {
  const index = Math.ceil((percentileValue / 100) * values.length) - 1;
  return values[Math.max(0, Math.min(values.length - 1, index))];
}

function formatMs(value) {
  return `${Math.round(value)}ms`;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
