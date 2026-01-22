import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";
import { z } from "zod";

import { ruleCreator } from "./ruleCreator.ts";

const javascriptReservedWords = new Set([
	"await",
	"break",
	"case",
	"catch",
	"class",
	"const",
	"continue",
	"debugger",
	"default",
	"delete",
	"do",
	"else",
	"enum",
	"export",
	"extends",
	"false",
	"finally",
	"for",
	"function",
	"if",
	"implements",
	"import",
	"in",
	"instanceof",
	"interface",
	"let",
	"new",
	"null",
	"package",
	"private",
	"protected",
	"public",
	"return",
	"static",
	"super",
	"switch",
	"this",
	"throw",
	"true",
	"try",
	"typeof",
	"var",
	"void",
	"while",
	"with",
	"yield",
]);

function getPropertyKeyText(
	node: AST.ElementAccessExpression,
): string | undefined {
	if (ts.isStringLiteral(node.argumentExpression)) {
		return node.argumentExpression.text;
	}
	if (node.argumentExpression.kind === ts.SyntaxKind.NullKeyword) {
		return "null";
	}
	if (node.argumentExpression.kind === ts.SyntaxKind.TrueKeyword) {
		return "true";
	}
	if (node.argumentExpression.kind === ts.SyntaxKind.FalseKeyword) {
		return "false";
	}
	return undefined;
}

function isValidIdentifier(name: string): boolean {
	return /^[\p{L}_$][\p{L}\d_$]*$/u.test(name);
}

function matchesPattern(key: string, pattern: string): boolean {
	if (!pattern) {
		return false;
	}
	try {
		return new RegExp(pattern).test(key);
	} catch {
		return false;
	}
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports bracket notation property access when dot notation can be used.",
		id: "propertyAccessNotation",
		presets: ["stylistic"],
	},
	messages: {
		preferBrackets: {
			primary: "Use bracket notation instead of dot notation for `{{key}}`.",
			secondary: [
				"Bracket notation should be used when required by allowPattern option.",
			],
			suggestions: ['Replace `.{{key}}` with `["{{key}}"]`.'],
		},
		preferDotNotation: {
			primary: "Use dot notation instead of bracket notation for `{{key}}`.",
			secondary: [
				"Dot notation is more concise and easier to read.",
				"Bracket notation should only be used when the property name is not a valid identifier or is a reserved word.",
			],
			suggestions: ['Replace `["{{key}}"]` with `.{{key}}`.'],
		},
	},
	options: {
		allowIndexSignaturePropertyAccess: z
			.boolean()
			.default(false)
			.describe(
				"Whether to allow accessing properties matching an index signature with bracket notation.",
			),
		allowPattern: z
			.string()
			.default("")
			.describe(
				"A regular expression pattern for property names that should not be converted to dot notation.",
			),
		allowPrivateClassPropertyAccess: z
			.boolean()
			.default(false)
			.describe(
				"Whether to allow accessing class members marked as `private` with bracket notation.",
			),
		allowProtectedClassPropertyAccess: z
			.boolean()
			.default(false)
			.describe(
				"Whether to allow accessing class members marked as `protected` with bracket notation.",
			),
		prefer: z
			.enum(["dot", "brackets"])
			.default("dot")
			.describe(
				"Whether to prefer dot notation ('dot') or bracket notation ('brackets') for property access.",
			),
	},
	setup(context) {
		return {
			visitors: {
				ElementAccessExpression: (node, { options, sourceFile }) => {
					if (options.prefer === "brackets") {
						return;
					}

					const key = getPropertyKeyText(node);
					if (
						key == null ||
						!isValidIdentifier(key) ||
						javascriptReservedWords.has(key) ||
						matchesPattern(key, options.allowPattern)
					) {
						return;
					}

					const objectText = node.expression.getText(sourceFile);
					const isOptionalChain = node.questionDotToken !== undefined;
					const dotOperator = isOptionalChain ? "?." : ".";

					context.report({
						data: { key },
						fix: {
							range: getTSNodeRange(node, sourceFile),
							text: `${objectText}${dotOperator}${key}`,
						},
						message: "preferDotNotation",
						range: {
							begin: node.argumentExpression.getStart(sourceFile),
							end: node.argumentExpression.getEnd(),
						},
					});
				},
				PropertyAccessExpression: (node, { options, sourceFile }) => {
					if (
						options.prefer !== "brackets" ||
						javascriptReservedWords.has(node.name.text) ||
						!matchesPattern(node.name.text, options.allowPattern)
					) {
						return;
					}

					const objectText = node.expression.getText(sourceFile);
					const bracketOperator = node.questionDotToken ? "?.[" : "[";

					context.report({
						data: { key: node.name.text },
						fix: {
							range: getTSNodeRange(node, sourceFile),
							text: `${objectText}${bracketOperator}"${node.name.text}"]`,
						},
						message: "preferBrackets",
						range: {
							begin: node.name.getStart(sourceFile),
							end: node.name.getEnd(),
						},
					});
				},
			},
		};
	},
});
