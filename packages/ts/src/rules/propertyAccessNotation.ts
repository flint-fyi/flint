import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

const JAVASCRIPT_RESERVED_WORDS = new Set([
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

function canUseDotNotation(key: string) {
	if (!isValidIdentifier(key)) {
		return false;
	}

	if (JAVASCRIPT_RESERVED_WORDS.has(key)) {
		return false;
	}

	return true;
}

function getPropertyKeyText(node: AST.ElementAccessExpression): null | string {
	if (!ts.isStringLiteral(node.argumentExpression)) {
		return null;
	}

	return node.argumentExpression.text;
}

function isValidIdentifier(name: string) {
	return /^[\p{L}_$][\p{L}\d_$]*$/u.test(name);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports bracket notation property access when dot notation can be used.",
		id: "propertyAccessNotation",
		presets: ["stylistic"],
	},
	messages: {
		preferDotNotation: {
			primary: "Use dot notation instead of bracket notation for `{{key}}`.",
			secondary: [
				"Dot notation is more concise and easier to read.",
				"Bracket notation should only be used when the property name is not a valid identifier or is a reserved word.",
			],
			suggestions: ['Replace `["{{key}}"]` with `.{{key}}`.'],
		},
	},
	setup(context) {
		return {
			visitors: {
				ElementAccessExpression: (node, { sourceFile }) => {
					const key = getPropertyKeyText(node);

					if (key === null) {
						return;
					}

					if (!canUseDotNotation(key)) {
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
			},
		};
	},
});
