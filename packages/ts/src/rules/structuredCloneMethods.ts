import { type AST, typescriptLanguage } from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function isJsonMethod(
	node: ts.Node,
	methodName: string,
): node is ts.CallExpression {
	if (!ts.isCallExpression(node)) {
		return false;
	}

	if (!ts.isPropertyAccessExpression(node.expression)) {
		return false;
	}

	const propertyAccess = node.expression;

	if (!ts.isIdentifier(propertyAccess.expression)) {
		return false;
	}

	return (
		propertyAccess.expression.text === "JSON" &&
		propertyAccess.name.text === methodName
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports JSON.parse(JSON.stringify()) patterns that can use structuredClone.",
		id: "structuredCloneMethods",
		presets: ["logical"],
	},
	messages: {
		preferStructuredClone: {
			primary:
				"Prefer `structuredClone()` over `JSON.parse(JSON.stringify())`.",
			secondary: [
				"structuredClone is the native deep cloning API available in modern JavaScript.",
				"It properly handles circular references and more data types than JSON methods.",
			],
			suggestions: ["Replace with structuredClone()."],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression(node: AST.CallExpression, { sourceFile }) {
					if (!isJsonMethod(node, "parse")) {
						return;
					}

					if (node.arguments.length !== 1) {
						return;
					}

					const argument = node.arguments[0];
					if (!argument || ts.isSpreadElement(argument)) {
						return;
					}

					if (!isJsonMethod(argument, "stringify")) {
						return;
					}

					if (argument.arguments.length !== 1) {
						return;
					}

					const stringifyArg = argument.arguments[0];
					if (!stringifyArg || ts.isSpreadElement(stringifyArg)) {
						return;
					}

					context.report({
						message: "preferStructuredClone",
						range: {
							begin: node.getStart(sourceFile),
							end: node.getEnd(),
						},
					});
				},
			},
		};
	},
});
