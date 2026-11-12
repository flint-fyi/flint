import { defineConfig, type UserConfig } from "tsdown";

import { base } from "@flint.fyi/build/tsdown";

const config: UserConfig = defineConfig({
	...base,
	entry: [
		"src/index.ts",
		"src/native/ast.ts",
		"src/native/fs.ts",
		"src/native/sync.ts",
	],
	exports: {
		devExports: true,
		// Other packages' tests share this helper during development, but it is
		// not published.
		customExports: (exports, { isPublish }) =>
			isPublish
				? exports
				: {
						...exports,
						"./test-utils": "./src/test/createNativeSourceFile.testUtils.ts",
					},
	},
});

export default config;
