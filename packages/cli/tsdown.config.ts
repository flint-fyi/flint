import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig, type UserConfig } from "tsdown";

import { base } from "@flint.fyi/build/tsdown";

const shikiCliDirectory = path.dirname(
	fileURLToPath(import.meta.resolve("@shikijs/cli")),
);

const config: UserConfig = defineConfig({
	...base,
	clean: true,
	deps: { alwaysBundle: [/^@shikijs\//, /^shiki(?:\/|$)/, "ansis"] },
	plugins: [
		{
			name: "typescript-nord-only",
			resolveId(source, importer): string | undefined {
				if (
					source === "shiki" &&
					importer &&
					path.dirname(path.resolve(importer)) === shikiCliDirectory
				) {
					return fileURLToPath(
						new URL("./src/presenters/detailed/shiki.ts", import.meta.url),
					);
				}
			},
		},
	],
});

export default config;
