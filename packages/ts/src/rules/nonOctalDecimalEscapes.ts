import {
	type TypeScriptFileServices,
	typescriptLanguage,
} from "../language.ts";
import * as AST from "../types/ast.ts";

const nonOctalDecimalEscapePattern = /\\[89]/g;

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports non-octal decimal escape sequences (\\8 and \\9) in string literals.",
		id: "nonOctalDecimalEscapes",
		preset: "logical",
	},
	messages: {
		unexpectedEscape: {
			primary:
				"Non-octal decimal escape sequences (\\8 and \\9) should not be used in string literals.",
			secondary: [
				"Non-octal decimal escape sequences \\8 and \\9 are legacy features that are treated as identity escapes (the same as the literal digits).",
				"They are optional in the ECMAScript specification and not supported in strict mode in all environments.",
				"Use the literal digits directly instead.",
			],
			suggestions: [
				"Remove the backslash to use the literal digit.",
				"If an escape sequence is needed, use a Unicode escape like \\u0038 or \\u0039.",
			],
		},
	},
	setup(context) {
		function checkNode(
			node: AST.NoSubstitutionTemplateLiteral | AST.StringLiteral,
			{ sourceFile }: TypeScriptFileServices,
		) {
			const text = node.getText(sourceFile);
			const matches = [...text.matchAll(nonOctalDecimalEscapePattern)];

			for (const match of matches) {
				// Ignore escapes where the backslash itself is escaped (e.g. "\\\\8" -> literal "\\8").
				// Count the number of consecutive backslashes immediately before the match.
				const matchIndex = match.index;
				let backslashesBefore = 0;
				for (let i = matchIndex - 1; i >= 0 && text[i] === "\\"; i--) {
					backslashesBefore++;
				}

				// If there is an odd number of backslashes before this one, the backslash is escaped
				// and should not be treated as an escape sequence.
				if (backslashesBefore % 2 === 1) {
					continue;
				}

				const start = node.getStart(sourceFile) + matchIndex;

				context.report({
					message: "unexpectedEscape",
					range: {
						begin: start,
						end: start + match[0].length,
					},
				});
			}
		}

		return {
			visitors: {
				NoSubstitutionTemplateLiteral: checkNode,
				StringLiteral: checkNode,
			},
		};
	},
});
