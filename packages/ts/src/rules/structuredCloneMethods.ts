import type { Program } from "typescript";
import { SyntaxKind } from "typescript-native/unstable/ast";

import {
	isGlobalDeclarationOfName,
	typescriptLanguage,
	type AST,
	type Checker,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

function isJsonMethod(
	node: AST.AnyNode,
	methodName: string,
	typeChecker: Checker,
	program: Program,
): node is AST.CallExpression {
	return (
		node.kind === SyntaxKind.CallExpression &&
		node.expression.kind === SyntaxKind.PropertyAccessExpression &&
		node.expression.expression.kind === SyntaxKind.Identifier &&
		isGlobalDeclarationOfName(
			node.expression.expression,
			"JSON",
			typeChecker,
			program,
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
				CallExpression(
					node: AST.CallExpression,
					{ program, sourceFile, typeChecker },
				) {
					if (
						!isJsonMethod(node, "parse", typeChecker, program) ||
						node.arguments.length !== 1
					) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const argument = node.arguments[0]!;

					if (
						argument.kind === SyntaxKind.SpreadElement ||
						!isJsonMethod(argument, "stringify", typeChecker, program) ||
						argument.arguments.length !== 1
					) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const stringifyArgument = argument.arguments[0]!;

					if (stringifyArgument.kind === SyntaxKind.SpreadElement) {
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
