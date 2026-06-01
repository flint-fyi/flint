#!/usr/bin/env node
import { enableCompileCache } from "node:module";

enableCompileCache();

await import("@flint.fyi/ts-patch/install-patch");

const { startServer } = await import("@flint.fyi/lsp");
startServer();
