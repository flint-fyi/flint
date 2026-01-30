import { typescriptLanguage } from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function isLowerCase(text: string) {
	return text === text.toLowerCase();
}

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function isStringLiteral(node: ts.Node) {
	return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);
}

function isUpperCase(text: string) {
	return text === text.toUpperCase();
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports string case method calls compared against literals with mismatched casing.",
		id: "stringCaseMismatches",
		presets: ["logical"],
	},
	messages: {
		mismatch: {
			primary:
				"This `{{method}}()` call is compared against a string that is not {{expectedCase}}.",
			secondary: [
				"The comparison will always be {{result}} because the casing doesn't match.",
			],
			suggestions: [
				'Change the compared string to {{expectedCase}}: "{{corrected}}".',
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression(node, { sourceFile }) {
					if (!ts.isPropertyAccessExpression(node.expression)) {
						return;
					}

					if (
						(node.expression.name.text !== "toLowerCase" &&
							node.expression.name.text !== "toUpperCase") ||
						node.arguments.length ||
						!ts.isBinaryExpression(node.parent)
					) {
						return;
					}

					const operator = node.parent.operatorToken.kind;
					if (
						operator !== ts.SyntaxKind.EqualsEqualsToken &&
						operator !== ts.SyntaxKind.EqualsEqualsEqualsToken &&
						operator !== ts.SyntaxKind.ExclamationEqualsToken &&
						operator !== ts.SyntaxKind.ExclamationEqualsEqualsToken
					) {
						return;
					}

					const otherSide =
						node.parent.left === node ? node.parent.right : node.parent.left;
					if (!isStringLiteral(otherSide)) {
						return;
					}

					const value = otherSide.text;
					const isToLower = node.expression.name.text === "toLowerCase";
					const expectedCase = isToLower ? "lowercase" : "uppercase";
					const matchesCase = isToLower
						? isLowerCase(value)
						: isUpperCase(value);

					if (matchesCase) {
						return;
					}

					const corrected = isToLower
						? value.toLowerCase()
						: value.toUpperCase();
					const isEquality =
						operator === ts.SyntaxKind.EqualsEqualsToken ||
						operator === ts.SyntaxKind.EqualsEqualsEqualsToken;

					context.report({
						data: {
							corrected,
							expectedCase,
							method: node.expression.name.text,
							result: isEquality ? "false" : "true",
						},
						message: "mismatch",
						range: {
							begin: otherSide.getStart(sourceFile),
							end: otherSide.getEnd(),
						},
					});
				},
			},
		};
	},
});
