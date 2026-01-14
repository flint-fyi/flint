import { createPlugin } from "@flint.fyi/core";

import bareUrls from "./rules/bareUrls.js";
import headingIncrements from "./rules/headingIncrements.js";
import linkFragments from "./rules/linkFragments.js";
import bareUrls from "./rules/bareUrls.ts";
import definitionContents from "./rules/definitionContents.ts";
import definitionDuplicates from "./rules/definitionDuplicates.ts";
import definitionUses from "./rules/definitionUses.ts";
import fencedCodeLanguages from "./rules/fencedCodeLanguages.ts";
import headingIncrements from "./rules/headingIncrements.ts";
import headingRootDuplicates from "./rules/headingRootDuplicates.ts";
import imageAltTexts from "./rules/imageAltTexts.ts";
import imageContents from "./rules/imageContents.ts";
import labelReferences from "./rules/labelReferences.ts";
import labelReferenceValidity from "./rules/labelReferenceValidity.ts";
import linkContents from "./rules/linkContents.ts";
import mediaSyntaxReversals from "./rules/mediaSyntaxReversals.ts";
import referenceLikeUrls from "./rules/referenceLikeUrls.ts";

export const md = createPlugin({
	files: {
		all: ["**/*.md"],
	},
	name: "md",
	rules: [bareUrls, headingIncrements, linkFragments],
	name: "Markdown",
	rules: [
		bareUrls,
		definitionContents,
		definitionDuplicates,
		definitionUses,
		fencedCodeLanguages,
		headingIncrements,
		headingRootDuplicates,
		imageAltTexts,
		imageContents,
		labelReferences,
		labelReferenceValidity,
		linkContents,
		mediaSyntaxReversals,
		referenceLikeUrls,
	],
});
