import { SyntaxKind } from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import * as AST from "../types/ast.ts";
import type { Checker } from "../types/checker.ts";
import { isGlobalDeclarationOfName } from "../utils/isGlobalDeclarationOfName.ts";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Prefer the shorter `Date.now()` to get the number of milliseconds since the Unix Epoch.",
		id: "dateNowTimestamps",
		preset: "logical",
	},
	messages: {
		preferDateNow: {
			primary: "Prefer the shorter `Date.now()` to get the current timestamp.",
			secondary: [
				"`Date.now()` is shorter and avoids unnecessary instantiation of `Date` objects.",
				"It's more efficient and clearer than alternatives like `new Date().getTime()`.",
			],
			suggestions: ["Replace with `Date.now()`."],
		},
	},
	setup(context) {
		function isNewDateWithNoArguments(
			node: AST.NewExpression,
			typeChecker: Checker,
		) {
			return (
				node.expression.kind === SyntaxKind.Identifier &&
				node.expression.text === "Date" &&
				!node.arguments?.length &&
				isGlobalDeclarationOfName(node.expression, "Date", typeChecker)
			);
		}

		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					if (
						node.expression.kind !== SyntaxKind.PropertyAccessExpression ||
						node.expression.name.kind !== SyntaxKind.Identifier ||
						node.arguments.length !== 0
					) {
						return;
					}

					const methodName = node.expression.name.text;
					if (methodName !== "getTime" && methodName !== "valueOf") {
						return;
					}

					if (
						node.expression.expression.kind !== SyntaxKind.NewExpression ||
						!isNewDateWithNoArguments(node.expression.expression, typeChecker)
					) {
						return;
					}

					context.report({
						message: "preferDateNow",
						range: {
							begin: node.expression.expression.getStart(sourceFile),
							end: node.getEnd(),
						},
					});
				},
				NewExpression: (node, { sourceFile, typeChecker }) => {
					if (!isNewDateWithNoArguments(node, typeChecker)) {
						return;
					}

					switch (node.parent.kind) {
						case SyntaxKind.CallExpression:
							if (
								node.parent.expression.kind === SyntaxKind.Identifier &&
								(node.parent.expression.text === "BigInt" ||
									node.parent.expression.text === "Number") &&
								node.parent.arguments.length === 1 &&
								isGlobalDeclarationOfName(
									node.parent.expression,
									node.parent.expression.text,
									typeChecker,
								)
							) {
								context.report({
									message: "preferDateNow",
									range: getTSNodeRange(node.parent, sourceFile),
								});
							}
							break;

						case SyntaxKind.PrefixUnaryExpression:
							if (
								node.parent.operator === SyntaxKind.MinusToken ||
								node.parent.operator === SyntaxKind.PlusToken
							) {
								context.report({
									message: "preferDateNow",
									range: getTSNodeRange(node, sourceFile),
								});
							}
							break;
					}
				},
			},
		};
	},
});
