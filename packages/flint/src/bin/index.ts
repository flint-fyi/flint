#!/usr/bin/env node
import { enableCompileCache } from "node:module";

import packageData from "flint/package.json" with { type: "json" };

enableCompileCache();

const { runCli } = await import("@flint.fyi/cli");
process.exitCode = await runCli(process.argv.slice(2), packageData.version);
