import { SyntaxKind } from "typescript-native/unstable/ast";
import {
	TypeFlags,
	type Program,
	type Symbol,
	type Type,
	type TypeReference,
} from "typescript-native/unstable/sync";

import {
	typescriptLanguage,
	type AST,
	type Checker,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { AnyType, discriminateAnyType } from "./utils/discriminateAnyType.ts";
import { formatReportedType } from "./utils/formatReportedType.ts";
import { isUnsafeAssignment } from "./utils/isUnsafeAssignment.ts";

function isTypeFlagSet(type: Type, flags: TypeFlags): boolean {
	return (type.flags & flags) !== 0;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports calling a function with a value typed as `any` as an argument.",
		id: "anyArguments",
		presets: ["logical", "logicalStrict"],
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
			const parameters = signature.getParameters();

			let parameterIndex = 0;

			for (const argument of node.arguments) {
				const argumentType = typeChecker.getTypeAtLocation(argument);

				if (argument.kind === SyntaxKind.SpreadElement) {
					const spreadType = typeChecker.getTypeAtLocation(argument.expression);
					const anyType = discriminateAnyType(
						spreadType,
						typeChecker,
						argument.expression,
					);

					if (anyType !== AnyType.Safe) {
						const restParameter = parameters.at(-1);
						if (restParameter) {
							const restType = typeChecker.getTypeOfSymbol(restParameter);
							if (isTypeFlagSet(restType, TypeFlags.Any | TypeFlags.Unknown)) {
								continue;
							}
							if (typeChecker.isArrayType(restType)) {
								const elementType = typeChecker.getTypeArguments(
									restType as TypeReference,
								)[0];
								if (
									elementType &&
									isTypeFlagSet(elementType, TypeFlags.Any | TypeFlags.Unknown)
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
							spreadType,
							parameters,
							parameterIndex,
							typeChecker,
							program,
							argument.expression,
						);
						if (tupleResult) {
							context.report({
								data: {
									paramType: formatReportedType(
										tupleResult.paramType,
										typeChecker,
									),
									type: tupleResult.type,
								},
								message: "unsafeTupleSpread",
								range: {
									begin: argument.getStart(sourceFile),
									end: argument.getEnd(),
								},
							});
						}
						const tupleTypeArgs = typeChecker.getTypeArguments(
							spreadType as TypeReference,
						);
						parameterIndex += tupleTypeArgs.length;
					}
					continue;
				}

				const anyType = discriminateAnyType(
					argumentType,
					typeChecker,
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
							argument,
							typeChecker,
						);
						if (unsafeResult) {
							context.report({
								data: {
									paramType: formatReportedType(
										unsafeResult.receiver,
										typeChecker,
									),
									type: formatReportedType(unsafeResult.sender, typeChecker),
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
				if (!parameters.length || !parameterInfo) {
					parameterIndex++;
					continue;
				}

				if (
					isTypeFlagSet(parameterInfo.type, TypeFlags.Any | TypeFlags.Unknown)
				) {
					parameterIndex++;
					continue;
				}

				context.report({
					data: {
						paramType: formatReportedType(parameterInfo.type, typeChecker),
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
				CallExpression: checkCallArguments,
				NewExpression: checkCallArguments,
				TaggedTemplateExpression: (node, { sourceFile, typeChecker }) => {
					const signature = typeChecker.getResolvedSignature(node);
					const parameters = signature.getParameters();
					if (parameters.length <= 1) {
						return;
					}

					const template = node.template;
					if (template.kind !== SyntaxKind.TemplateExpression) {
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
							expression,
						);

						if (anyType === AnyType.Safe) {
							const parameter = parameters[i + 1];
							if (parameter) {
								const parameterType = typeChecker.getTypeOfSymbol(parameter);
								const unsafeResult = isUnsafeAssignment(
									expressionType,
									parameterType,
									expression,
									typeChecker,
								);
								if (unsafeResult) {
									context.report({
										data: {
											paramType: formatReportedType(
												unsafeResult.receiver,
												typeChecker,
											),
											type: formatReportedType(
												unsafeResult.sender,
												typeChecker,
											),
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
							isTypeFlagSet(parameterType, TypeFlags.Any | TypeFlags.Unknown)
						) {
							continue;
						}

						context.report({
							data: {
								paramType: formatReportedType(parameterType, typeChecker),
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
			parameters: readonly Symbol[],
			index: number,
			typeChecker: Checker,
		): undefined | { symbol: Symbol; tupleIndex?: number; type: Type } {
			if (!parameters.length) {
				return undefined;
			}

			const lastParam = parameters.at(-1);
			if (!lastParam) {
				return undefined;
			}

			const lastParamDeclaration = lastParam.declarations[0]?.resolve() as
				| AST.Declaration
				| undefined;

			if (
				lastParamDeclaration?.kind === SyntaxKind.Parameter &&
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
						restType as TypeReference,
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
			tupleType: Type,
			parameters: readonly Symbol[],
			startIndex: number,
			typeChecker: Checker,
			program: Program,
			node: AST.AnyNode,
		): undefined | { paramType: Type; type: string } {
			const tupleTypeArgs = typeChecker.getTypeArguments(
				tupleType as TypeReference,
			);

			for (const [i, elementType] of tupleTypeArgs.entries()) {
				const anyType = discriminateAnyType(elementType, typeChecker, node);

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

				if (isTypeFlagSet(parameterType, TypeFlags.Any | TypeFlags.Unknown)) {
					continue;
				}

				return {
					paramType: parameterType,
					type: anyType,
				};
			}

			return undefined;
		}
	},
});
