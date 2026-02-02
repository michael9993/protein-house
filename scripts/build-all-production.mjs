#!/usr/bin/env node
/**
 * Production build script for all apps and storefront.
 * Run from repo root: node scripts/build-all-production.mjs
 * Or: pnpm build:production (if root package.json has this script)
 *
 * Toggle:
 * - Development: pnpm dev (in apps/ or storefront/)
 * - Production build: node scripts/build-all-production.mjs then pnpm start in each app
 */

import { spawnSync } from "node:child_process";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const buildLogPath = path.join(ROOT, "build-production.log");
const logStream = createWriteStream(buildLogPath, { flags: "w" });

function writeLog(msg) {
	const line = `[${new Date().toISOString()}] ${msg}\n`;
	process.stdout.write(line);
	logStream.write(line);
}

function run(name, cwd, command, args) {
	writeLog(`\n--- ${name} (${command} ${args.join(" ")}) ---`);
	const result = spawnSync(command, args, {
		cwd,
		shell: true,
		stdio: ["inherit", "pipe", "pipe"],
		env: { ...process.env, NODE_ENV: "production" },
	});
	const out = (result.stdout && result.stdout.toString()) || "";
	const err = (result.stderr && result.stderr.toString()) || "";
	if (out) logStream.write(out);
	if (err) logStream.write(err);
	if (result.status !== 0) {
		writeLog(`FAILED ${name} (exit ${result.status})`);
		if (err) process.stderr.write(err);
		if (out) process.stdout.write(out.slice(-4000));
	}
	return { name, ok: result.status === 0, status: result.status, out, err };
}

const results = [];
const pm = process.env.PACKAGE_MANAGER || "pnpm";

// 1. Apps monorepo (smtp, newsletter, invoices, stripe, storefront-control, sales-analytics, etc.)
results.push(run("apps (all Saleor apps)", path.join(ROOT, "apps"), pm, ["build"]));

// 2. Storefront
results.push(run("storefront", path.join(ROOT, "storefront"), pm, ["build"]));

// Summary
writeLog("\n========== BUILD SUMMARY ==========");
let failed = 0;
for (const r of results) {
	writeLog(`${r.ok ? "OK" : "FAIL"} ${r.name}${r.status !== 0 ? ` (exit ${r.status})` : ""}`);
	if (!r.ok) failed++;
}
writeLog(`Log written to: ${buildLogPath}`);
writeLog("====================================\n");

logStream.end();

process.exit(failed > 0 ? 1 : 0);
