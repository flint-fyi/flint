import ts, { SyntaxKind } from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import type * as AST from "../types/ast.ts";
import { hasSameTokens } from "../utils/hasSameTokens.ts";
import { isFunction } from "../utils/isFunction.ts";

export default typescriptLanguage.createRule({
	about: {
		description: "Prefer the spread operator over `.apply()` calls.",
		id: "functionApplySpreads",
		preset: "stylistic",
	},
	messages: {
		preferSpread: {
			primary: "Use the spread operator instead of `.apply()`.",
			secondary: [
				"The spread operator (`...`) provides cleaner syntax for variadic function calls.",
				"`func.apply(thisArg, args)` can be replaced with `func.call(thisArg, ...args)` or `thisArg.func(...args)`.",
			],
			suggestions: [
				"Replace `.apply(thisArg, args)` with spread syntax like `func(...args)`.",
			],
		},
	},
	setup(context) {
		function isNullOrUndefined(node: AST.Expression) {
			return (
				node.kind === SyntaxKind.NullKeyword ||
				(node.kind === SyntaxKind.Identifier && node.text === "undefined")
			);
		}

		function isApplyCall(node: AST.CallExpression) {
			if (node.expression.kind !== SyntaxKind.PropertyAccessExpression) {
				return false;
			}

			const propertyAccess = node.expression;
			if (propertyAccess.name.kind !== SyntaxKind.Identifier) {
				return false;
			}

			return propertyAccess.name.text === "apply";
		}

		function getVariadicArgumentsNode(node: AST.CallExpression) {
			if (!isApplyCall(node) || node.arguments.length !== 2) {
				return undefined;
			}

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const argumentsNode = node.arguments[1]!;

			if (
				argumentsNode.kind === SyntaxKind.ArrayLiteralExpression ||
				argumentsNode.kind === SyntaxKind.SpreadElement
			) {
				return undefined;
			}

			return argumentsNode;
		}

		function getExpectedThis(
			node: AST.PropertyAccessExpression,
		): AST.Expression | undefined {
			const applied = node.expression;

			if (applied.kind === SyntaxKind.PropertyAccessExpression) {
				return applied.expression;
			}

			return undefined;
		}

		function isValidThisArg(
			expectedThis: AST.Expression | undefined,
			thisArg: AST.Expression,
			sourceFile: ts.SourceFile,
		) {
			return expectedThis
				? hasSameTokens(expectedThis, thisArg, sourceFile)
				: isNullOrUndefined(thisArg);
		}

		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					const argumentsNode = getVariadicArgumentsNode(node);
					if (!argumentsNode) {
						return;
					}

					if (
						!ts.isPropertyAccessExpression(node.expression) ||
						!isFunction(node.expression.expression, typeChecker)
					) {
						return;
					}

					const expectedThis = getExpectedThis(node.expression);

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const thisArg = node.arguments[0]!;
					if (!isValidThisArg(expectedThis, thisArg, sourceFile)) {
						return;
					}

					const argumentsText = argumentsNode.getText(sourceFile);
					const range = getTSNodeRange(node, sourceFile);

					const callerText = node.expression.expression.getText(sourceFile);
					const fixedText = `${callerText}(...${argumentsText})`;

					context.report({
						fix: {
							range,
							text: fixedText,
						},
						message: "preferSpread",
						range,
					});
				},
			},
		};
	},
});
