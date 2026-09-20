import { SyntaxKind } from "typescript-native/unstable/ast";
import {
	TypeFlags,
	type Checker,
	type Program,
	type Type,
} from "typescript-native/unstable/sync";

import {
	declarationIncludesGlobal,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports `Promise` catch callback parameters that are not typed as unknown.",
		id: "catchCallbackTypes",
		presets: ["logical", "logicalStrict"],
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
		function isGlobalPromiseType(type: Type, program: Program): boolean {
			const symbol = type.getSymbol();
			if (symbol?.name !== "Promise") {
				return false;
			}

			const declarations = symbol.declarations
				.map((declaration) => declaration.resolve())
				.filter((declaration): declaration is AST.Declaration => !!declaration);
			if (!declarations.length) {
				return false;
			}

			return declarations.some(
				(declaration) =>
					declaration.kind === SyntaxKind.InterfaceDeclaration &&
					declaration.name.text === "Promise" &&
					declarationIncludesGlobal(declaration, program),
			);
		}

		function isCatchOrThenCallback(
			node: AST.CallExpression,
			typeChecker: Checker,
			program: Program,
		): "catch" | "then" | undefined {
			if (node.expression.kind !== SyntaxKind.PropertyAccessExpression) {
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

			if (!isGlobalPromiseType(objectType, program)) {
				return undefined;
			}

			return methodName === "catch" ? "catch" : "then";
		}

		function checkCallbackParameter(
			callback: AST.Expression,
			sourceFile: AST.SourceFile,
			typeChecker: Checker,
		): void {
			if (
				(callback.kind !== SyntaxKind.ArrowFunction &&
					callback.kind !== SyntaxKind.FunctionExpression) ||
				!callback.parameters.length
			) {
				return;
			}

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const firstParameter = callback.parameters[0]!;

			if (firstParameter.type) {
				const parameterType = typeChecker.getTypeFromTypeNode(
					firstParameter.type,
				);

				if (
					(parameterType.flags & TypeFlags.Unknown) !== 0 ||
					(parameterType.flags & TypeFlags.Any) === 0
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
				CallExpression: (node, { program, sourceFile, typeChecker }) => {
					const callbackType = isCatchOrThenCallback(
						node,
						typeChecker,
						program,
					);

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
