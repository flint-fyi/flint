#!/usr/bin/env node
import { enableCompileCache } from "node:module";

enableCompileCache();

await import("@flint.fyi/ts-patch/install-patch");
const { runCli } = await import("@flint.fyi/cli");
process.exitCode = await runCli(process.argv.slice(2));
