import path from "node:path";
import { fileURLToPath } from "node:url";

import license from "rollup-plugin-license";
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
		license({
			thirdParty: {
				multipleVersions: true,
				output: fileURLToPath(new URL("./dist/licenses.txt", import.meta.url)),
			},
		}),
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
