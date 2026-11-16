import { readdirSync } from "node:fs";
import path from "node:path";
import { platform } from "node:process";

import {
	defaultExclude,
	defineConfig,
	type ViteUserConfigExport,
} from "vitest/config";

const config: ViteUserConfigExport = defineConfig({
	test: {
		coverage: {
			exclude: [...defaultExclude, "e2e/tests/**"],
			include: ["packages/**/src/**/*.{ts,tsx}"],
			reporter: ["html", "lcov", "text"],
		},
		projects: readdirSync(path.join(import.meta.dirname, "packages")).map(
			(name) => ({
				test: {
					clearMocks: true,
					include: ["**/src/**/*.test.ts", "**/tests/**/*.test.ts"],
					name,
					root: path.join(import.meta.dirname, "packages", name),
					setupFiles: [
						"console-fail-test/setup",
						"@flint.fyi/ts-patch/install-patch-hooks",
					],
					snapshotSerializers: name === "e2e" ? ["vitest-ansi-serializer"] : [],
					testTimeout:
						(name === "e2e" ? 20_000 : 10_000) * (platform === "win32" ? 3 : 1),
				},
			}),
		),
	},
});

export default config;
