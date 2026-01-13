import * as tsutils from "ts-api-utils";
import * as ts from "typescript";

import { typescriptLanguage } from "../language.ts";
import type * as AST from "../types/ast.ts";
import type { Checker } from "../types/checker.ts";
import { AnyType, discriminateAnyType } from "./utils/discriminateAnyType.ts";
import { isUnsafeAssignment } from "./utils/isUnsafeAssignment.ts";

function isTypeAny(type: ts.Type): boolean {
	return tsutils.isTypeFlagSet(type, ts.TypeFlags.Any);
}

function isTypeAnyArray(type: ts.Type, checker: Checker): boolean {
	if (!checker.isArrayType(type)) {
		return false;
	}
	const typeArgs = checker.getTypeArguments(type);
	const elementType = typeArgs[0];
	return elementType !== undefined && isTypeAny(elementType);
}

function isTypeAnyOrUnknown(type: ts.Type): boolean {
	return tsutils.isTypeFlagSet(type, ts.TypeFlags.Any | ts.TypeFlags.Unknown);
}

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports assigning a value with type `any` to variables and properties.",
		id: "anyAssignments",
		preset: "logical",
	},
	messages: {
		unsafeArrayDestructure: {
			primary: "Unsafe array destructuring of a value of type {{ type }}.",
			secondary: [
				"Destructuring an `any[]` array defeats TypeScript's type safety guarantees.",
				"This can allow unexpected types to propagate through your codebase, potentially causing runtime errors.",
			],
			suggestions: [
				"Ensure the array has a well-defined, specific element type.",
			],
		},
		unsafeArrayPatternFromTuple: {
			primary:
				"Unsafe array destructuring of a tuple element with type {{ type }}.",
			secondary: [
				"Destructuring a tuple with `any` elements defeats TypeScript's type safety guarantees.",
				"This can allow unexpected types to propagate through your codebase, potentially causing runtime errors.",
			],
			suggestions: [
				"Ensure the tuple has well-defined, specific element types.",
			],
		},
		unsafeArraySpread: {
			primary:
				"Unsafe spread of type `{{ sender }}` into array of type `{{ receiver }}`.",
			secondary: [
				"Spreading an `any[]` into a typed array defeats TypeScript's type safety guarantees.",
				"This can allow unexpected types to propagate through your codebase, potentially causing runtime errors.",
			],
			suggestions: ["Ensure the spread array has compatible element types."],
		},
		unsafeAssignment: {
			primary: "Unsafe assignment of a value of type {{ type }}.",
			secondary: [
				"Assigning a value of type `any` or a similar unsafe type defeats TypeScript's type safety guarantees.",
				"This can allow unexpected types to propagate through your codebase, potentially causing runtime errors.",
			],
			suggestions: [
				"Ensure the assigned value has a well-defined, specific type.",
			],
		},
		unsafeAssignmentToVariable: {
			primary:
				"Unsafe assignment of type `{{ sender }}` to variable of type `{{ receiver }}`.",
			secondary: [
				"The variable's declared type does not safely accept the value being assigned.",
				"This can allow unexpected types to propagate through your codebase, potentially causing runtime errors.",
			],
			suggestions: [
				"Adjust the type of the variable to match the assigned value, if appropriate.",
				"Otherwise, refine the assigned value to ensure it matches the expected type.",
			],
		},
		unsafeObjectPattern: {
			primary:
				"Unsafe object destructuring of a property with type {{ type }}.",
			secondary: [
				"Destructuring an object with `any` properties defeats TypeScript's type safety guarantees.",
				"This can allow unexpected types to propagate through your codebase, potentially causing runtime errors.",
			],
			suggestions: [
				"Ensure the object has well-defined, specific property types.",
			],
		},
	},
	setup(context) {
		function checkArrayDestructureWorker(
			pattern: ts.ArrayBindingPattern,
			senderType: ts.Type,
			sourceFile: ts.SourceFile,
			typeChecker: Checker,
		): boolean {
			if (isTypeAnyArray(senderType, typeChecker)) {
				context.report({
					data: { type: "`any[]`" },
					message: "unsafeArrayDestructure",
					range: {
						begin: pattern.getStart(sourceFile),
						end: pattern.getEnd(),
					},
				});
				return true;
			}

			if (!typeChecker.isTupleType(senderType)) {
				return false;
			}

			const tupleElements = typeChecker.getTypeArguments(senderType);
			let didReport = false;

			for (let i = 0; i < pattern.elements.length; i++) {
				const element = pattern.elements[i];
				if (!element || ts.isOmittedExpression(element)) {
					continue;
				}

				if (element.dotDotDotToken) {
					continue;
				}

				const elementType = tupleElements[i];
				if (!elementType) {
					continue;
				}

				const name = element.name;

				if (isTypeAny(elementType)) {
					context.report({
						data: { type: "`any`" },
						message: "unsafeArrayPatternFromTuple",
						range: {
							begin: name.getStart(sourceFile),
							end: name.getEnd(),
						},
					});
					didReport = true;
				} else if (ts.isArrayBindingPattern(name)) {
					didReport =
						checkArrayDestructureWorker(
							name,
							elementType,
							sourceFile,
							typeChecker,
						) || didReport;
				} else if (ts.isObjectBindingPattern(name)) {
					didReport =
						checkObjectDestructureWorker(
							name,
							elementType,
							sourceFile,
							typeChecker,
						) || didReport;
				}
			}

			return didReport;
		}

		function checkObjectDestructureWorker(
			pattern: ts.ObjectBindingPattern,
			senderType: ts.Type,
			sourceFile: ts.SourceFile,
			typeChecker: Checker,
		): boolean {
			let didReport = false;

			for (const element of pattern.elements) {
				if (element.dotDotDotToken) {
					continue;
				}

				let key: string | undefined;
				const propertyName = element.propertyName ?? element.name;

				if (ts.isIdentifier(propertyName)) {
					key = propertyName.text;
				} else if (ts.isStringLiteral(propertyName)) {
					key = propertyName.text;
				} else if (ts.isNumericLiteral(propertyName)) {
					key = propertyName.text;
				} else if (
					ts.isComputedPropertyName(propertyName) &&
					ts.isStringLiteral(propertyName.expression)
				) {
					key = propertyName.expression.text;
				} else if (
					ts.isComputedPropertyName(propertyName) &&
					ts.isNoSubstitutionTemplateLiteral(propertyName.expression)
				) {
					key = propertyName.expression.text;
				}

				if (key === undefined) {
					continue;
				}

				const propertySymbol = senderType.getProperty(key);
				if (!propertySymbol) {
					continue;
				}

				const propertyType = typeChecker.getTypeOfSymbolAtLocation(
					propertySymbol,
					pattern,
				);

				const name = element.name;

				if (isTypeAny(propertyType)) {
					context.report({
						data: { type: "`any`" },
						message: "unsafeObjectPattern",
						range: {
							begin: name.getStart(sourceFile),
							end: name.getEnd(),
						},
					});
					didReport = true;
				} else if (ts.isArrayBindingPattern(name)) {
					didReport =
						checkArrayDestructureWorker(
							name,
							propertyType,
							sourceFile,
							typeChecker,
						) || didReport;
				} else if (ts.isObjectBindingPattern(name)) {
					didReport =
						checkObjectDestructureWorker(
							name,
							propertyType,
							sourceFile,
							typeChecker,
						) || didReport;
				}
			}

			return didReport;
		}

		function checkArrayDestructure(
			pattern: AST.ArrayBindingPattern,
			senderType: ts.Type,
			sourceFile: ts.SourceFile,
			typeChecker: Checker,
		): boolean {
			return checkArrayDestructureWorker(
				pattern as unknown as ts.ArrayBindingPattern,
				senderType,
				sourceFile,
				typeChecker,
			);
		}

		function checkObjectDestructure(
			pattern: AST.ObjectBindingPattern,
			senderType: ts.Type,
			sourceFile: ts.SourceFile,
			typeChecker: Checker,
		): boolean {
			return checkObjectDestructureWorker(
				pattern as unknown as ts.ObjectBindingPattern,
				senderType,
				sourceFile,
				typeChecker,
			);
		}

		function checkAssignment(
			initializerType: ts.Type,
			declaredType: ts.Type | undefined,
			initializer: AST.Expression,
			reportNode: ts.Node,
			sourceFile: ts.SourceFile,
			typeChecker: Checker,
			program: ts.Program,
		): boolean {
			const anyType = discriminateAnyType(
				initializerType,
				typeChecker,
				program,
				initializer as unknown as ts.Node,
			);

			if (declaredType === undefined) {
				if (anyType !== AnyType.Safe) {
					context.report({
						data: {
							type:
								anyType === AnyType.Any
									? "`any`"
									: anyType === AnyType.PromiseAny
										? "`Promise<any>`"
										: "`any[]`",
						},
						message: "unsafeAssignment",
						range: {
							begin: reportNode.getStart(sourceFile),
							end: reportNode.getEnd(),
						},
					});
					return true;
				}
				return false;
			}

			if (isTypeAnyOrUnknown(declaredType)) {
				return false;
			}

			const result = isUnsafeAssignment(
				initializerType,
				declaredType,
				typeChecker,
				initializer,
			);
			if (!result) {
				return false;
			}

			context.report({
				data: {
					receiver: typeChecker.typeToString(result.receiver),
					sender: typeChecker.typeToString(result.sender),
				},
				message: "unsafeAssignmentToVariable",
				range: {
					begin: reportNode.getStart(sourceFile),
					end: reportNode.getEnd(),
				},
			});
			return true;
		}

		return {
			visitors: {
				ArrayLiteralExpression: (node, { sourceFile, typeChecker }) => {
					for (const element of node.elements) {
						if (!ts.isSpreadElement(element)) {
							continue;
						}

						const spreadType = typeChecker.getTypeAtLocation(
							element.expression,
						);
						if (!typeChecker.isArrayType(spreadType)) {
							continue;
						}

						const spreadTypeArgs = typeChecker.getTypeArguments(spreadType);
						const spreadElementType = spreadTypeArgs[0];
						if (!spreadElementType || !isTypeAny(spreadElementType)) {
							continue;
						}

						const parentType = typeChecker.getContextualType(node);
						if (!parentType || !typeChecker.isArrayType(parentType)) {
							continue;
						}

						const parentTypeArgs = typeChecker.getTypeArguments(parentType);
						const parentElementType = parentTypeArgs[0];
						if (!parentElementType || isTypeAnyOrUnknown(parentElementType)) {
							continue;
						}

						context.report({
							data: {
								receiver: typeChecker.typeToString(parentType),
								sender: typeChecker.typeToString(spreadType),
							},
							message: "unsafeArraySpread",
							range: {
								begin: element.getStart(sourceFile),
								end: element.getEnd(),
							},
						});
					}
				},

				Parameter: (node, { program, sourceFile, typeChecker }) => {
					if (!node.initializer) {
						return;
					}

					const initializerType = typeChecker.getTypeAtLocation(
						node.initializer,
					);

					if (ts.isArrayBindingPattern(node.name)) {
						checkArrayDestructure(
							node.name,
							initializerType,
							sourceFile,
							typeChecker,
						);
						return;
					}

					if (ts.isObjectBindingPattern(node.name)) {
						checkObjectDestructure(
							node.name,
							initializerType,
							sourceFile,
							typeChecker,
						);
						return;
					}

					const declaredType = node.type
						? typeChecker.getTypeAtLocation(node.name)
						: undefined;
					checkAssignment(
						initializerType,
						declaredType,
						node.initializer,
						node,
						sourceFile,
						typeChecker,
						program,
					);
				},

				PropertyAssignment: (node, { sourceFile, typeChecker }) => {
					const initializerType = typeChecker.getTypeAtLocation(
						node.initializer,
					);

					if (!isTypeAny(initializerType)) {
						return;
					}

					const parent = node.parent;
					if (!ts.isObjectLiteralExpression(parent)) {
						return;
					}

					const contextualType = typeChecker.getContextualType(parent);
					if (!contextualType) {
						return;
					}

					let key: string | undefined;
					if (ts.isIdentifier(node.name)) {
						key = node.name.text;
					} else if (ts.isStringLiteral(node.name)) {
						key = node.name.text;
					} else if (ts.isNumericLiteral(node.name)) {
						key = node.name.text;
					}

					if (key === undefined) {
						return;
					}

					const propertySymbol = contextualType.getProperty(key);
					if (!propertySymbol) {
						return;
					}

					const expectedType = typeChecker.getTypeOfSymbolAtLocation(
						propertySymbol,
						node,
					);

					if (isTypeAnyOrUnknown(expectedType)) {
						return;
					}

					context.report({
						data: { type: "`any`" },
						message: "unsafeAssignment",
						range: {
							begin: node.getStart(sourceFile),
							end: node.getEnd(),
						},
					});
				},

				PropertyDeclaration: (node, { program, sourceFile, typeChecker }) => {
					if (!node.initializer) {
						return;
					}

					const initializerType = typeChecker.getTypeAtLocation(
						node.initializer,
					);
					const declaredType = node.type
						? typeChecker.getTypeAtLocation(node.name)
						: undefined;

					checkAssignment(
						initializerType,
						declaredType,
						node.initializer,
						node,
						sourceFile,
						typeChecker,
						program,
					);
				},

				ShorthandPropertyAssignment: (node, { sourceFile, typeChecker }) => {
					const initializerType = typeChecker.getTypeAtLocation(node.name);

					if (!isTypeAny(initializerType)) {
						return;
					}

					const parent = node.parent;
					if (!ts.isObjectLiteralExpression(parent)) {
						return;
					}

					const contextualType = typeChecker.getContextualType(parent);
					if (!contextualType) {
						return;
					}

					const propertySymbol = contextualType.getProperty(node.name.text);
					if (!propertySymbol) {
						return;
					}

					const expectedType = typeChecker.getTypeOfSymbolAtLocation(
						propertySymbol,
						node,
					);

					if (isTypeAnyOrUnknown(expectedType)) {
						return;
					}

					context.report({
						data: { type: "`any`" },
						message: "unsafeAssignment",
						range: {
							begin: node.getStart(sourceFile),
							end: node.getEnd(),
						},
					});
				},

				VariableDeclaration: (node, { program, sourceFile, typeChecker }) => {
					if (!node.initializer) {
						return;
					}

					const initializerType = typeChecker.getTypeAtLocation(
						node.initializer,
					);

					if (ts.isArrayBindingPattern(node.name)) {
						checkArrayDestructure(
							node.name,
							initializerType,
							sourceFile,
							typeChecker,
						);
						return;
					}

					if (ts.isObjectBindingPattern(node.name)) {
						checkObjectDestructure(
							node.name,
							initializerType,
							sourceFile,
							typeChecker,
						);
						return;
					}

					const declaredType = node.type
						? typeChecker.getTypeAtLocation(node.name)
						: undefined;

					checkAssignment(
						initializerType,
						declaredType,
						node.initializer,
						node,
						sourceFile,
						typeChecker,
						program,
					);
				},
			},
		};
	},
});
