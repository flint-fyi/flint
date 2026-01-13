import { SyntaxKind } from "typescript";

import { typescriptLanguage } from "../language.ts";
import * as AST from "../types/ast.ts";
import type { Checker } from "../types/checker.ts";
import { isGlobalDeclarationOfName } from "../utils/isGlobalDeclarationOfName.ts";

function isDateType(node: AST.Expression, typeChecker: Checker) {
	return typeChecker.getTypeAtLocation(node).getSymbol()?.getName() === "Date";
}

export default typescriptLanguage.createRule({
	about: {
		description:
			"Prefer passing a `Date` directly to the `Date` constructor when cloning, rather than calling `getTime()`.",
		id: "dateConstructorClones",
		preset: "logical",
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
				NewExpression: (node, { sourceFile, typeChecker }) => {
					if (
						node.expression.kind !== SyntaxKind.Identifier ||
						node.expression.text !== "Date" ||
						node.arguments?.length !== 1 ||
						!isGlobalDeclarationOfName(node.expression, "Date", typeChecker)
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
						argument.arguments.length !== 0 ||
						!isDateType(argument.expression.expression, typeChecker)
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
