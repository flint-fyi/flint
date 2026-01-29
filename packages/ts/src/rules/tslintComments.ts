import { typescriptLanguage } from "@flint.fyi/typescript-language";
import * as tsutils from "ts-api-utils";

import { ruleCreator } from "./ruleCreator.ts";

const tslintDirectiveRegex =
	/^\s*\/?tslint:(?:enable|disable)(?:-(?:line|next-line))?(?::|\s|$)/i;

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports TSLint disable/enable comments.",
		id: "tslintComments",
		presets: ["logical"],
	},
	messages: {
		tslintComment: {
			primary: "TSLint is deprecated and its comments are no longer necessary.",
			secondary: [
				"TSLint has been replaced by other linters such as Flint.",
				"These comments no longer have any effect.",
			],
			suggestions: [
				"Remove the TSLint comment.",
				"Replace it with the equivalent Flint comment if needed.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				SourceFile: (node) => {
					const comments = tsutils.iterateComments(node);

					for (const { end, pos, text } of comments) {
						const commentContent = text
							.replace(/^\/\/\s*/, "")
							.replace(/^\/\*\s*/, "")
							.replace(/\s*\*\/$/, "");

						if (tslintDirectiveRegex.test(commentContent)) {
							context.report({
								message: "tslintComment",
								range: { begin: pos, end },
							});
						}
					}
				},
			},
		};
	},
});
