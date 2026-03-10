import { createPlugin } from "@flint.fyi/core";
import vForKeys from "./rules/vForKeys.ts";

export const vue = createPlugin({
	name: "Vue.js",
	rules: [vForKeys],
});
