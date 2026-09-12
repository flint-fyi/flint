import { SyntaxKind } from "typescript-native/unstable/ast";

import {
	getStaticStringValue,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

function isLowerCase(text: string) {
	return text === text.toLowerCase();
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
				"This `{{ method }}()` call is compared against a string that is not {{ expectedCase }}.",
			secondary: [
				"The comparison will always be {{ result }} because the casing doesn't match.",
			],
			suggestions: [
				'Change the compared string to {{ expectedCase }}: "{{ corrected }}".',
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression(node, { sourceFile }) {
					if (node.expression.kind !== SyntaxKind.PropertyAccessExpression) {
						return;
					}

					if (
						(node.expression.name.text !== "toLowerCase" &&
							node.expression.name.text !== "toUpperCase") ||
						node.arguments.length ||
						node.parent.kind !== SyntaxKind.BinaryExpression
					) {
						return;
					}

					const operator = node.parent.operatorToken.kind;
					if (
						operator !== SyntaxKind.EqualsEqualsToken &&
						operator !== SyntaxKind.EqualsEqualsEqualsToken &&
						operator !== SyntaxKind.ExclamationEqualsToken &&
						operator !== SyntaxKind.ExclamationEqualsEqualsToken
					) {
						return;
					}

					const otherSide =
						node.parent.left === node ? node.parent.right : node.parent.left;
					const value = getStaticStringValue(otherSide);
					if (value === undefined) {
						return;
					}
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
						operator === SyntaxKind.EqualsEqualsToken ||
						operator === SyntaxKind.EqualsEqualsEqualsToken;

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
