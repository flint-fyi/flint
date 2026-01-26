import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function isErrorType(type: ts.Type, typeChecker: ts.TypeChecker): boolean {
	const symbol = type.getSymbol();
	const symbolName = symbol?.getName();

	if (symbolName === "Error" || symbolName?.endsWith("Error")) {
		return true;
	}

	if (type.isUnion()) {
		return type.types.every((t) => isErrorType(t, typeChecker));
	}

	if (type.isIntersection()) {
		return type.types.some((t) => isErrorType(t, typeChecker));
	}

	const baseTypes = type.getBaseTypes?.();
	if (baseTypes) {
		for (const baseType of baseTypes) {
			if (isErrorType(baseType, typeChecker)) {
				return true;
			}
		}
	}

	return false;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports throwing values that are not Error objects.",
		id: "throwErrors",
		presets: ["logical"],
	},
	messages: {
		throwError: {
			primary: "Only Error objects should be thrown.",
			secondary: [
				"Throwing non-Error values loses stack trace information.",
				"Error objects provide consistent behavior and debugging information.",
			],
			suggestions: [
				"Wrap the value in an Error: `throw new Error(value)`.",
				"Create a custom Error class for specific error types.",
			],
		},
		throwUndefined: {
			primary: "Throwing `undefined` is not allowed.",
			secondary: ["Throwing undefined provides no useful information."],
			suggestions: ["Throw an Error object with a descriptive message."],
		},
	},
	setup(context) {
		return {
			visitors: {
				ThrowStatement(
					node: AST.ThrowStatement,
					{ sourceFile, typeChecker }: TypeScriptFileServices,
				) {
					const expression = node.expression;
					if (!expression) {
						return;
					}

					if (
						ts.isStringLiteral(expression) ||
						ts.isNoSubstitutionTemplateLiteral(expression)
					) {
						context.report({
							message: "throwError",
							range: {
								begin: expression.getStart(sourceFile),
								end: expression.getEnd(),
							},
						});
						return;
					}

					if (ts.isNumericLiteral(expression)) {
						context.report({
							message: "throwError",
							range: {
								begin: expression.getStart(sourceFile),
								end: expression.getEnd(),
							},
						});
						return;
					}

					if (
						expression.kind === ts.SyntaxKind.TrueKeyword ||
						expression.kind === ts.SyntaxKind.FalseKeyword
					) {
						context.report({
							message: "throwError",
							range: {
								begin: expression.getStart(sourceFile),
								end: expression.getEnd(),
							},
						});
						return;
					}

					if (
						expression.kind === ts.SyntaxKind.UndefinedKeyword ||
						(ts.isIdentifier(expression) && expression.text === "undefined")
					) {
						context.report({
							message: "throwUndefined",
							range: {
								begin: expression.getStart(sourceFile),
								end: expression.getEnd(),
							},
						});
						return;
					}

					if (expression.kind === ts.SyntaxKind.NullKeyword) {
						context.report({
							message: "throwError",
							range: {
								begin: expression.getStart(sourceFile),
								end: expression.getEnd(),
							},
						});
						return;
					}

					if (ts.isObjectLiteralExpression(expression)) {
						context.report({
							message: "throwError",
							range: {
								begin: expression.getStart(sourceFile),
								end: expression.getEnd(),
							},
						});
						return;
					}

					if (typeChecker) {
						const type = typeChecker.getTypeAtLocation(expression);

						if (
							type.flags & ts.TypeFlags.Any ||
							type.flags & ts.TypeFlags.Unknown
						) {
							return;
						}

						if (!isErrorType(type, typeChecker)) {
							const typeString = typeChecker.typeToString(type);
							if (!typeString.includes("Error") && typeString !== "never") {
								context.report({
									message: "throwError",
									range: {
										begin: expression.getStart(sourceFile),
										end: expression.getEnd(),
									},
								});
							}
						}
					}
				},
			},
		};
	},
});
