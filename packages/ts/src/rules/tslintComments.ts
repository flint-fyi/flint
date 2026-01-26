import { typescriptLanguage } from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

const tslintDirectiveRegex =
	/^\s*\/?tslint:(enable|disable)(?:-(line|next-line))?(:|\s|$)/i;

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports TSLint disable/enable comments.",
		id: "tslintComments",
		presets: ["logical"],
	},
	messages: {
		tslintComment: {
			primary: "TSLint comments are deprecated.",
			secondary: [
				"TSLint has been replaced by ESLint for TypeScript linting.",
				"These comments no longer have any effect.",
			],
			suggestions: ["Remove the TSLint comment."],
		},
	},
	setup(context) {
		return {
			visitors: {
				SourceFile: (node, { sourceFile }) => {
					const sourceText = sourceFile.getFullText();
					const reportedRanges = new Set<string>();

					function checkComment(text: string, pos: number, end: number) {
						const rangeKey = `${pos}:${end}`;
						if (reportedRanges.has(rangeKey)) {
							return;
						}

						const commentContent = text
							.replace(/^\/\/\s*/, "")
							.replace(/^\/\*\s*/, "")
							.replace(/\s*\*\/$/, "");

						if (tslintDirectiveRegex.test(commentContent)) {
							reportedRanges.add(rangeKey);
							context.report({
								message: "tslintComment",
								range: { begin: pos, end },
							});
						}
					}

					ts.forEachLeadingCommentRange(sourceText, 0, (pos, end) => {
						checkComment(sourceText.slice(pos, end), pos, end);
					});

					function visit(astNode: ts.Node) {
						const leadingComments = ts.getLeadingCommentRanges(
							sourceText,
							astNode.getFullStart(),
						);
						if (leadingComments) {
							for (const comment of leadingComments) {
								checkComment(
									sourceText.slice(comment.pos, comment.end),
									comment.pos,
									comment.end,
								);
							}
						}

						const trailingComments = ts.getTrailingCommentRanges(
							sourceText,
							astNode.getEnd(),
						);
						if (trailingComments) {
							for (const comment of trailingComments) {
								checkComment(
									sourceText.slice(comment.pos, comment.end),
									comment.pos,
									comment.end,
								);
							}
						}

						ts.forEachChild(astNode, visit);
					}

					ts.forEachChild(sourceFile, visit);
				},
			},
		};
	},
});
