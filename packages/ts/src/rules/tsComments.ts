import { typescriptLanguage } from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

const tsDirectiveRegex =
	/^(?:\/\/\/?|\/\*)\s*@ts-(ignore|expect-error|nocheck|check)[\s:$*]?/i;

interface CommentRange {
	end: number;
	pos: number;
}

function collectAllComments(
	sourceFile: ts.SourceFile,
	sourceText: string,
): CommentRange[] {
	const comments: CommentRange[] = [];
	const seen = new Set<string>();

	const addComment = (range: CommentRange) => {
		const key = `${range.pos}:${range.end}`;
		if (!seen.has(key)) {
			seen.add(key);
			comments.push(range);
		}
	};

	const leadingAtStart = ts.getLeadingCommentRanges(sourceText, 0);
	if (leadingAtStart) {
		for (const range of leadingAtStart) {
			addComment(range);
		}
	}

	const visit = (node: ts.Node) => {
		const leading = ts.getLeadingCommentRanges(sourceText, node.getFullStart());
		if (leading) {
			for (const range of leading) {
				addComment(range);
			}
		}

		const trailing = ts.getTrailingCommentRanges(sourceText, node.getEnd());
		if (trailing) {
			for (const range of trailing) {
				addComment(range);
			}
		}

		ts.forEachChild(node, visit);
	};

	ts.forEachChild(sourceFile, visit);

	return comments;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports problematic TypeScript comment directives.",
		id: "tsComments",
		presets: ["logical"],
	},
	messages: {
		nocheck: {
			primary: "Do not use @ts-nocheck to disable type checking.",
			secondary: [
				"This disables type checking for the entire file.",
				"Prefer fixing type errors or using targeted suppressions.",
			],
			suggestions: ["Remove @ts-nocheck and fix the type errors."],
		},
		preferExpectError: {
			primary: "Use @ts-expect-error instead of @ts-ignore.",
			secondary: [
				"@ts-expect-error will report if the next line has no error.",
				"This helps identify stale suppressions when errors are fixed.",
			],
			suggestions: ["Replace @ts-ignore with @ts-expect-error."],
		},
	},
	setup(context) {
		return {
			visitors: {
				SourceFile(_node, { sourceFile }) {
					const sourceText = sourceFile.getFullText();
					const comments = collectAllComments(sourceFile, sourceText);

					for (const comment of comments) {
						const text = sourceText.slice(comment.pos, comment.end);
						const match = tsDirectiveRegex.exec(text);
						if (!match) {
							continue;
						}

						const directive = match[1].toLowerCase();

						if (directive === "ignore") {
							context.report({
								message: "preferExpectError",
								range: { begin: comment.pos, end: comment.end },
							});
						} else if (directive === "nocheck") {
							context.report({
								message: "nocheck",
								range: { begin: comment.pos, end: comment.end },
							});
						}
					}
				},
			},
		};
	},
});
