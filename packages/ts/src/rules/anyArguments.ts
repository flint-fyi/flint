import * as tsutils from "ts-api-utils";
import * as ts from "typescript";

import type { AST, Checker } from "../index.ts";
import {
	type TypeScriptFileServices,
	typescriptLanguage,
} from "../language.ts";
import { AnyType, discriminateAnyType } from "./utils/discriminateAnyType.ts";
import { isUnsafeAssignment } from "./utils/isUnsafeAssignment.ts";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports calling a function with a value typed as `any` as an argument.",
		id: "anyArguments",
		preset: "logical",
	},
	messages: {
		unsafeArgument: {
			primary:
				"Unsafe argument of type `{{ type }}` assigned to parameter of type `{{ paramType }}`.",
			secondary: [
				"Passing a value of type `any` or a similar unsafe type as an argument defeats TypeScript's type safety guarantees.",
				"This can allow unexpected types to propagate through your codebase, potentially causing runtime errors.",
			],
			suggestions: [
				"Ensure the argument has a well-defined, specific type before passing it to the function.",
			],
		},
		unsafeSpread: {
			primary: "Unsafe spread of type `{{ type }}` in function call.",
			secondary: [
				"Spreading an `any` or `any[]` typed value as function arguments bypasses type checking.",
				"This can allow unexpected types to propagate through your codebase, potentially causing runtime errors.",
			],
			suggestions: [
				"Ensure the spread value has a well-defined tuple or array type before spreading it.",
			],
		},
		unsafeTupleSpread: {
			primary:
				"Unsafe spread of tuple type. The argument is of type `{{ type }}` assigned to parameter of type `{{ paramType }}`.",
			secondary: [
				"One or more elements in this tuple spread contains an `any` type that will be assigned to a typed parameter.",
				"This can allow unexpected types to propagate through your codebase, potentially causing runtime errors.",
			],
			suggestions: [
				"Ensure all tuple elements have well-defined types that match the expected parameter types.",
			],
		},
	},
	setup(context) {
		function checkCallArguments(
			node: AST.CallExpression | AST.NewExpression,
			{ program, sourceFile, typeChecker }: TypeScriptFileServices,
		) {
			if (!node.arguments) {
				return;
			}

			const signature = typeChecker.getResolvedSignature(node);
			if (!signature) {
				return;
			}

			const parameters = signature.getParameters();

			let parameterIndex = 0;

			for (const argument of node.arguments) {
				const argumentType = typeChecker.getTypeAtLocation(argument);

				if (ts.isSpreadElement(argument)) {
					const spreadType = typeChecker.getTypeAtLocation(argument.expression);
					const anyType = discriminateAnyType(
						spreadType,
						typeChecker,
						program,
						argument.expression,
					);

					if (anyType !== AnyType.Safe) {
						const restParameter = parameters.at(-1);
						if (restParameter) {
							const restType = typeChecker.getTypeOfSymbol(restParameter);
							if (
								tsutils.isTypeFlagSet(
									restType,
									ts.TypeFlags.Any | ts.TypeFlags.Unknown,
								)
							) {
								continue;
							}
							if (typeChecker.isArrayType(restType)) {
								const elementType = typeChecker.getTypeArguments(restType)[0];
								if (
									elementType &&
									tsutils.isTypeFlagSet(
										elementType,
										ts.TypeFlags.Any | ts.TypeFlags.Unknown,
									)
								) {
									continue;
								}
							}
						}

						context.report({
							data: {
								type: anyType,
							},
							message: "unsafeSpread",
							range: {
								begin: argument.getStart(sourceFile),
								end: argument.getEnd(),
							},
						});
						continue;
					}

					if (typeChecker.isTupleType(spreadType)) {
						const tupleResult = checkTupleSpread(
							spreadType as ts.TypeReference,
							parameters,
							parameterIndex,
							typeChecker,
							program,
							argument.expression,
						);
						if (tupleResult) {
							context.report({
								data: {
									paramType: typeChecker.typeToString(tupleResult.paramType),
									type: "any",
								},
								message: "unsafeTupleSpread",
								range: {
									begin: argument.getStart(sourceFile),
									end: argument.getEnd(),
								},
							});
						}
						const tupleTypeArgs = typeChecker.getTypeArguments(
							spreadType as ts.TypeReference,
						);
						parameterIndex += tupleTypeArgs.length;
					}
					continue;
				}

				const anyType = discriminateAnyType(
					argumentType,
					typeChecker,
					program,
					argument,
				);

				if (anyType === AnyType.Safe) {
					const paramInfo = getParameterAtIndex(
						parameters,
						parameterIndex,
						typeChecker,
					);
					if (paramInfo) {
						const unsafeResult = isUnsafeAssignment(
							argumentType,
							paramInfo.type,
							typeChecker,
							argument,
						);
						if (unsafeResult) {
							context.report({
								data: {
									paramType: typeChecker.typeToString(unsafeResult.receiver),
									type: typeChecker.typeToString(unsafeResult.sender),
								},
								message: "unsafeArgument",
								range: {
									begin: argument.getStart(sourceFile),
									end: argument.getEnd(),
								},
							});
						}
					}
					parameterIndex++;
					continue;
				}

				const parameterInfo = getParameterAtIndex(
					parameters,
					parameterIndex,
					typeChecker,
				);
				if (parameters.length === 0 || !parameterInfo) {
					parameterIndex++;
					continue;
				}

				if (
					tsutils.isTypeFlagSet(
						parameterInfo.type,
						ts.TypeFlags.Any | ts.TypeFlags.Unknown,
					)
				) {
					parameterIndex++;
					continue;
				}

				context.report({
					data: {
						paramType: typeChecker.typeToString(parameterInfo.type),
						type: anyType,
					},
					message: "unsafeArgument",
					range: {
						begin: argument.getStart(sourceFile),
						end: argument.getEnd(),
					},
				});
				parameterIndex++;
			}
		}

		return {
			visitors: {
				CallExpression: (node, fileServices) => {
					checkCallArguments(node, fileServices);
				},
				NewExpression: (node, fileServices) => {
					checkCallArguments(node, fileServices);
				},
				TaggedTemplateExpression: (
					node,
					{ program, sourceFile, typeChecker },
				) => {
					const signature = typeChecker.getResolvedSignature(node);
					if (!signature) {
						return;
					}

					const parameters = signature.getParameters();
					if (parameters.length <= 1) {
						return;
					}

					const template = node.template;
					if (!ts.isTemplateExpression(template)) {
						return;
					}

					const expressions = template.templateSpans.map(
						(span) => span.expression,
					);

					for (const [i, expression] of expressions.entries()) {
						const expressionType = typeChecker.getTypeAtLocation(expression);

						const anyType = discriminateAnyType(
							expressionType,
							typeChecker,
							program,
							expression,
						);

						if (anyType === AnyType.Safe) {
							const parameter = parameters[i + 1];
							if (parameter) {
								const parameterType = typeChecker.getTypeOfSymbol(parameter);
								const unsafeResult = isUnsafeAssignment(
									expressionType,
									parameterType,
									typeChecker,
									expression,
								);
								if (unsafeResult) {
									context.report({
										data: {
											paramType: typeChecker.typeToString(
												unsafeResult.receiver,
											),
											type: typeChecker.typeToString(unsafeResult.sender),
										},
										message: "unsafeArgument",
										range: {
											begin: expression.getStart(sourceFile) - 2,
											end: expression.getEnd() + 1,
										},
									});
								}
							}
							continue;
						}

						const parameter = parameters[i + 1];
						if (!parameter) {
							continue;
						}

						const parameterType = typeChecker.getTypeOfSymbol(parameter);

						if (
							tsutils.isTypeFlagSet(
								parameterType,
								ts.TypeFlags.Any | ts.TypeFlags.Unknown,
							)
						) {
							continue;
						}

						context.report({
							data: {
								paramType: typeChecker.typeToString(parameterType),
								type: anyType,
							},
							message: "unsafeArgument",
							range: {
								begin: expression.getStart(sourceFile) - 2,
								end: expression.getEnd() + 1,
							},
						});
					}
				},
			},
		};

		function getParameterAtIndex(
			parameters: readonly ts.Symbol[],
			index: number,
			typeChecker: ts.TypeChecker,
		): undefined | { symbol: ts.Symbol; tupleIndex?: number; type: ts.Type } {
			if (parameters.length === 0) {
				return undefined;
			}

			const lastParam = parameters.at(-1);
			if (!lastParam) {
				return undefined;
			}

			const lastParamDeclaration = lastParam.declarations?.[0];

			if (
				lastParamDeclaration &&
				ts.isParameter(lastParamDeclaration) &&
				lastParamDeclaration.dotDotDotToken
			) {
				if (index < parameters.length - 1) {
					const param = parameters[index];
					if (!param) {
						return undefined;
					}
					return { symbol: param, type: typeChecker.getTypeOfSymbol(param) };
				}

				const restType = typeChecker.getTypeOfSymbol(lastParam);

				if (typeChecker.isTupleType(restType)) {
					const tupleArgs = typeChecker.getTypeArguments(
						restType as ts.TypeReference,
					);
					const tupleIndex = index - (parameters.length - 1);
					const tupleType = tupleArgs[tupleIndex];
					if (tupleType) {
						return {
							symbol: lastParam,
							tupleIndex,
							type: tupleType,
						};
					}
					return undefined;
				}

				return { symbol: lastParam, type: restType };
			}

			if (index >= parameters.length) {
				return undefined;
			}

			const param = parameters[index];
			if (!param) {
				return undefined;
			}
			return { symbol: param, type: typeChecker.getTypeOfSymbol(param) };
		}

		function checkTupleSpread(
			tupleType: ts.TypeReference,
			parameters: readonly ts.Symbol[],
			startIndex: number,
			typeChecker: Checker,
			program: ts.Program,
			node: ts.Node,
		): undefined | { paramType: ts.Type } {
			const tupleTypeArgs = typeChecker.getTypeArguments(tupleType);

			for (const [i, elementType] of tupleTypeArgs.entries()) {
				const anyType = discriminateAnyType(
					elementType,
					typeChecker,
					program,
					node,
				);

				if (anyType === AnyType.Safe) {
					continue;
				}

				const paramInfo = getParameterAtIndex(
					parameters,
					startIndex + i,
					typeChecker,
				);
				if (!paramInfo) {
					continue;
				}

				const parameterType = paramInfo.type;

				if (
					tsutils.isTypeFlagSet(
						parameterType,
						ts.TypeFlags.Any | ts.TypeFlags.Unknown,
					)
				) {
					continue;
				}

				return { paramType: parameterType };
			}

			return undefined;
		}
	},
});
