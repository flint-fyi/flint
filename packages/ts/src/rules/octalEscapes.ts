import type * as ts from "typescript";

import { typescriptLanguage } from "../language.ts";
import * as AST from "../types/ast.ts";

/**
 * Finds the position and length of an octal escape sequence in a string.
 * Returns undefined if no octal escape is found.
 */
function findOctalEscape(
	text: string,
): undefined | { index: number; length: number } {
	// Remove quotes from the string literal
	const content = text.slice(1, -1);

	// Match octal escapes: \0 followed by [0-7], or \1-7 optionally followed by [0-7]
	// But exclude escaped backslashes (\\)
	const octalEscapePattern = /(?<!\\)\\0[0-7]|(?<!\\)\\[1-7][0-7]*/;
	const match = octalEscapePattern.exec(content);

	if (!match) {
		return undefined;
	}

	// Add 1 to account for the opening quote
	return {
		index: match.index + 1,
		length: match[0].length,
	};
}

export default typescriptLanguage.createRule({
	about: {
		description: "Reports using octal escape sequences in string literals.",
		id: "octalEscapes",
		preset: "logical",
	},
	messages: {
		noOctalEscape: {
			primary:
				"Prefer hexadecimal or Unicode escape sequences over legacy octal escape sequences.",
			secondary: [
				"Octal escape sequences (e.g., `\\01`, `\\02`, `\\377`) are a deprecated feature in JavaScript that can lead to confusion and are forbidden in strict mode and template literals.",
				"They are less readable than their modern alternatives and can cause portability issues.",
			],
			suggestions: [
				"Use hexadecimal escape sequences (e.g., `\\x01`) or Unicode escape sequences (e.g., `\\u0001`) instead.",
			],
		},
	},
	setup(context) {
		function checkNode(
			node:
				| AST.NoSubstitutionTemplateLiteral
				| AST.StringLiteral
				| AST.TemplateHead
				| AST.TemplateMiddle
				| AST.TemplateTail,
			sourceFile: ts.SourceFile,
		) {
			const text = node.getText(sourceFile);
			const octalEscape = findOctalEscape(text);

			if (!octalEscape) {
				return;
			}

			const nodeStart = node.getStart(sourceFile);
			context.report({
				message: "noOctalEscape",
				range: {
					begin: nodeStart + octalEscape.index,
					end: nodeStart + octalEscape.index + octalEscape.length,
				},
			});
		}

		return {
			visitors: {
				NoSubstitutionTemplateLiteral: (node, { sourceFile }) => {
					checkNode(node, sourceFile);
				},
				StringLiteral: (node, { sourceFile }) => {
					checkNode(node, sourceFile);
				},
				TemplateExpression: (node, { sourceFile }) => {
					// Check the head of the template
					checkNode(node.head, sourceFile);

					// Check each template span
					for (const span of node.templateSpans) {
						checkNode(span.literal, sourceFile);
					}
				},
			},
		};
	},
});
