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
					setupFiles: ["console-fail-test/setup"],
					snapshotSerializers: name === "e2e" ? ["vitest-ansi-serializer"] : [],
					testTimeout:
						name === "e2e" ? (platform === "win32" ? 60_000 : 20_000) : 10_000,
				},
			}),
		),
	},
});

export default config;
