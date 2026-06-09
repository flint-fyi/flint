import * as tsutils from "ts-api-utils";
import ts, { SyntaxKind } from "typescript";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type Checker,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Require Promise-like statements to be handled appropriately.",
		id: "floatingPromises",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		floating: {
			primary:
				"Promises must be awaited, returned, or have their errors handled with `.catch()` or `.then()` with a rejection handler.",
			secondary: [
				"A 'floating' Promise is one that is created without any code set up to handle any errors it might throw.",
				"Floating Promises can cause unhandled rejections, improperly sequenced operations, and silent failures.",
			],
			suggestions: [
				"Add `await` before the Promise expression.",
				"Add `.catch()` to handle potential rejections.",
				"Add `void` operator to explicitly mark the Promise as intentionally not awaited.",
			],
		},
	},
	setup(context) {
		function isPromiseLike(tsNode: ts.Node, checker: Checker, type?: ts.Type) {
			type ??= checker.getTypeAtLocation(tsNode);

			return tsutils.isThenableType(checker, tsNode, type);
		}

		function isPromiseArray(tsNode: ts.Node, checker: Checker) {
			const type = checker.getTypeAtLocation(tsNode);

			for (const typePart of tsutils
				.unionConstituents(type)
				.map((t) => checker.getApparentType(t))) {
				if (checker.isArrayType(typePart)) {
					const arrayType = checker.getTypeArguments(typePart)[0];
					if (arrayType && isPromiseLike(tsNode, checker, arrayType)) {
						return true;
					}
				}

				if (checker.isTupleType(typePart)) {
					for (const tupleElementType of checker.getTypeArguments(typePart)) {
						if (isPromiseLike(tsNode, checker, tupleElementType)) {
							return true;
						}
					}
				}
			}

			return false;
		}

		function isCatchOrThenWithRejectionHandler(node: AST.CallExpression) {
			if (node.expression.kind !== SyntaxKind.PropertyAccessExpression) {
				return false;
			}

			const methodName = node.expression.name;
			if (methodName.kind !== SyntaxKind.Identifier) {
				return false;
			}

			if (methodName.text === "catch" && node.arguments.length >= 1) {
				return true;
			}

			if (methodName.text === "then" && node.arguments.length >= 2) {
				return true;
			}

			return false;
		}

		function isFinallyCall(node: AST.CallExpression) {
			if (node.expression.kind !== SyntaxKind.PropertyAccessExpression) {
				return false;
			}

			const methodName = node.expression.name;
			return (
				methodName.kind === SyntaxKind.Identifier &&
				methodName.text === "finally"
			);
		}

		function isUnhandledPromise(
			node: AST.Expression,
			checker: Checker,
		): boolean {
			if (node.kind === SyntaxKind.BinaryExpression) {
				if (
					node.operatorToken.kind === SyntaxKind.EqualsToken ||
					node.operatorToken.kind === SyntaxKind.CommaToken
				) {
					return false;
				}
			}

			if (node.kind === SyntaxKind.VoidExpression) {
				return false;
			}

			if (node.kind === SyntaxKind.AwaitExpression) {
				return false;
			}

			const tsNode = node as ts.Node;

			if (isPromiseArray(tsNode, checker)) {
				return true;
			}

			if (!isPromiseLike(tsNode, checker)) {
				return false;
			}

			if (node.kind === SyntaxKind.CallExpression) {
				if (isCatchOrThenWithRejectionHandler(node)) {
					return false;
				}

				if (isFinallyCall(node)) {
					const objectExpr = node.expression as AST.PropertyAccessExpression;
					return isUnhandledPromise(objectExpr.expression, checker);
				}
			}

			if (node.kind === SyntaxKind.ConditionalExpression) {
				return (
					isUnhandledPromise(node.whenTrue, checker) ||
					isUnhandledPromise(node.whenFalse, checker)
				);
			}

			if (node.kind === SyntaxKind.BinaryExpression) {
				if (
					node.operatorToken.kind === SyntaxKind.AmpersandAmpersandToken ||
					node.operatorToken.kind === SyntaxKind.BarBarToken ||
					node.operatorToken.kind === SyntaxKind.QuestionQuestionToken
				) {
					return (
						isUnhandledPromise(node.left, checker) ||
						isUnhandledPromise(node.right, checker)
					);
				}
			}

			return true;
		}

		return {
			visitors: {
				ExpressionStatement: (node, { sourceFile, typeChecker }) => {
					let expression = node.expression;

					while (expression.kind === SyntaxKind.ParenthesizedExpression) {
						expression = expression.expression;
					}

					if (!isUnhandledPromise(expression, typeChecker)) {
						return;
					}

					context.report({
						message: "floating",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});
