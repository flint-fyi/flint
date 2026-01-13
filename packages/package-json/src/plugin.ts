import { createPlugin } from "@flint.fyi/core";

export const packageJson = createPlugin({
	files: {
		all: ["**/package.json"],
	},
	name: "PackageJSON",
	rules: [],
});
