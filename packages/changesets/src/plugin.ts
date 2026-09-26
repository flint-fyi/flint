import { createPlugin } from "@flint.fyi/core";

import summaryCasing from "./rules/summaryCasing.ts";
import summaryPunctuation from "./rules/summaryPunctuation.ts";
import summaryReadability from "./rules/summaryReadability.ts";

export const changesets = createPlugin({
	files: {
		all: [".changeset/*.md"],
	},
	name: "Changesets",
	rules: [summaryCasing, summaryPunctuation, summaryReadability],
});
