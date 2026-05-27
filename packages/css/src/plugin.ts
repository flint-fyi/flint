import { createPlugin } from "@flint.fyi/core";

import hexColorValidity from "./rules/hexColorValidity.ts";

export const css = createPlugin({
	files: {
		all: ["**/*.css"],
	},
	name: "CSS",
	rules: [hexColorValidity],
});
