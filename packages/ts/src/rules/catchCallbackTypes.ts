import * as tsutils from "ts-api-utils";
import * as ts from "typescript";

import type { AST } from "../index.ts";
import { typescriptLanguage } from "../language.ts";
import type { Checker } from "../types/checker.ts";
import { declarationIncludesGlobal } from "../utils/declarationIncludesGlobal.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports `Promise` catch callback parameters that are not typed as unknown.",
		id: "catchCallbackTypes",
		presets: ["logical"],
	},
	messages: {
		preferUnknown: {
			primary:
				"The catch callback parameter should be typed as the safer `unknown` instead of `any`.",
			secondary: [
				"TypeScript's `useUnknownInCatchVariables` option only affects synchronous catch clauses, not Promise callbacks.",
				"Promise rejection values can be anything, so using `unknown` forces proper type narrowing before use.",
				"Using `any` in catch callbacks undermines type safety and can lead to runtime errors.",
			],
			suggestions: [
				"Add an explicit `: unknown` type annotation to the callback parameter.",
			],
		},
	},
	setup(context) {
		function isGlobalPromiseType(type: ts.Type): boolean {
			const symbol = type.getSymbol();
			if (symbol?.getName() !== "Promise") {
				return false;
			}

			const declarations = symbol.getDeclarations();
			if (!declarations) {
				return false;
			}

			return declarations.some(
				(declaration) =>
					ts.isInterfaceDeclaration(declaration) &&
					declaration.name.text === "Promise" &&
					declarationIncludesGlobal(declaration),
			);
		}

		function isCatchOrThenCallback(
			node: AST.CallExpression,
			typeChecker: Checker,
		): "catch" | "then" | undefined {
			if (!ts.isPropertyAccessExpression(node.expression)) {
				return undefined;
			}

			const methodName = node.expression.name.text;
			if (methodName !== "catch" && methodName !== "then") {
				return undefined;
			}

			const objectType = getConstrainedTypeAtLocation(
				node.expression.expression,
				typeChecker,
			);

			if (!isGlobalPromiseType(objectType)) {
				return undefined;
			}

			return methodName === "catch" ? "catch" : "then";
		}

		function checkCallbackParameter(
			callback: AST.Expression,
			sourceFile: ts.SourceFile,
			typeChecker: ts.TypeChecker,
		) {
			if (!ts.isFunctionLike(callback) || callback.parameters.length === 0) {
				return;
			}

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const firstParameter = callback.parameters[0]!;

			if (firstParameter.type) {
				const paramType = typeChecker.getTypeFromTypeNode(firstParameter.type);

				if (
					tsutils.isTypeFlagSet(paramType, ts.TypeFlags.Unknown) ||
					!tsutils.isTypeFlagSet(paramType, ts.TypeFlags.Any)
				) {
					return;
				}
			}

			context.report({
				message: "preferUnknown",
				range: {
					begin: firstParameter.name.getStart(sourceFile),
					end: firstParameter.type
						? firstParameter.type.getEnd()
						: firstParameter.name.getEnd(),
				},
			});
		}

		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					const callbackType = isCatchOrThenCallback(node, typeChecker);

					switch (callbackType) {
						case "catch":
							if (node.arguments.length >= 1) {
								checkCallbackParameter(
									// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
									node.arguments[0]!,
									sourceFile,
									typeChecker,
								);
							}
							break;
						case "then":
							if (node.arguments.length >= 2) {
								checkCallbackParameter(
									// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
									node.arguments[1]!,
									sourceFile,
									typeChecker,
								);
							}
							break;
					}
				},
			},
		};
	},
});
