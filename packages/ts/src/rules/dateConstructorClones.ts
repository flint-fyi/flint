import { SyntaxKind } from "typescript-native/unstable/ast";

import {
	isGlobalDeclarationOfName,
	typescriptLanguage,
	type AST,
	type Checker,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

function isDateType(node: AST.Expression, checker: Checker) {
	return checker.getTypeAtLocation(node).getSymbol()?.name === "Date";
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Prefer passing a `Date` directly to the `Date` constructor when cloning, rather than calling `getTime()`.",
		id: "dateConstructorClones",
		presets: ["logical"],
	},
	messages: {
		unnecessaryGetTime: {
			primary: "Prefer passing the Date directly instead of calling getTime().",
			secondary: [
				"The Date constructor can clone a Date object directly when passed as an argument.",
				"Calling getTime() first is unnecessary since ES2015.",
			],
			suggestions: ["Remove the `.getTime()` call and pass the Date directly."],
		},
	},
	setup(context) {
		return {
			visitors: {
				NewExpression: (node, { program, sourceFile, checker }) => {
					if (
						node.expression.kind !== SyntaxKind.Identifier ||
						node.expression.text !== "Date" ||
						node.arguments?.length !== 1 ||
						!isGlobalDeclarationOfName(
							node.expression,
							"Date",
							checker,
							program,
						)
					) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const argument = node.arguments[0]!;
					if (
						argument.kind !== SyntaxKind.CallExpression ||
						argument.expression.kind !== SyntaxKind.PropertyAccessExpression ||
						argument.expression.name.kind !== SyntaxKind.Identifier ||
						argument.expression.name.text !== "getTime" ||
						!!argument.arguments.length ||
						!isDateType(argument.expression.expression, checker)
					) {
						return;
					}

					context.report({
						message: "unnecessaryGetTime",
						range: {
							begin: argument.expression.name.getStart(sourceFile),
							end: argument.getEnd(),
						},
					});
				},
			},
		};
	},
});
