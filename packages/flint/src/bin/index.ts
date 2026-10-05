#!/usr/bin/env node
import { enableCompileCache } from "node:module";

if (!process.env.CI) {
	enableCompileCache();
}

const { runCli } = await import("@flint.fyi/cli");
process.exitCode = await runCli(process.argv.slice(2));
