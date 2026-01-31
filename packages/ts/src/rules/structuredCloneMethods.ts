import {
	type AST,
	type Checker,
	isGlobalDeclarationOfName,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function isJsonMethod(
	node: ts.Node,
	methodName: string,
	typeChecker: Checker,
): node is ts.CallExpression {
	return (
		ts.isCallExpression(node) &&
		ts.isPropertyAccessExpression(node.expression) &&
		ts.isIdentifier(node.expression.expression) &&
		isGlobalDeclarationOfName(
			node.expression.expression,
			"JSON",
			typeChecker,
		) &&
		node.expression.expression.text === "JSON" &&
		node.expression.name.text === methodName
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
				CallExpression(node: AST.CallExpression, { sourceFile, typeChecker }) {
					if (
						!isJsonMethod(node, "parse", typeChecker) ||
						node.arguments.length !== 1
					) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const argument = node.arguments[0]!;

					if (
						ts.isSpreadElement(argument) ||
						!isJsonMethod(argument, "stringify", typeChecker) ||
						argument.arguments.length !== 1
					) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const stringifyArgument = argument.arguments[0]!;

					if (ts.isSpreadElement(stringifyArgument)) {
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
