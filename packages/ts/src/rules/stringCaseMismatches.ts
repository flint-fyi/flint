import { typescriptLanguage } from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function isStringLiteral(
	node: ts.Node,
): node is ts.StringLiteral | ts.NoSubstitutionTemplateLiteral {
	return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);
}

function isLowerCase(str: string): boolean {
	return str === str.toLowerCase();
}

function isUpperCase(str: string): boolean {
	return str === str.toUpperCase();
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
				"This {{method}}() call is compared against a string that is not {{expectedCase}}.",
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

					const methodName = node.expression.name.text;
					if (methodName !== "toLowerCase" && methodName !== "toUpperCase") {
						return;
					}

					if (node.arguments.length !== 0) {
						return;
					}

					const parent = node.parent;
					if (!ts.isBinaryExpression(parent)) {
						return;
					}

					const operator = parent.operatorToken.kind;
					if (
						operator !== ts.SyntaxKind.EqualsEqualsToken &&
						operator !== ts.SyntaxKind.EqualsEqualsEqualsToken &&
						operator !== ts.SyntaxKind.ExclamationEqualsToken &&
						operator !== ts.SyntaxKind.ExclamationEqualsEqualsToken
					) {
						return;
					}

					const otherSide = parent.left === node ? parent.right : parent.left;
					if (!isStringLiteral(otherSide)) {
						return;
					}

					const value = otherSide.text;
					const isToLower = methodName === "toLowerCase";
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
							method: methodName,
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
