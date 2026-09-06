import * as ts from "typescript-native/unstable/ast";
import { SyntaxKind } from "typescript-native/unstable/ast";
import {
	TypeFlags,
	type Type,
	type TypeReference,
} from "typescript-native/unstable/sync";

import {
	typescriptLanguage,
	type AST,
	type Checker,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { AnyType, discriminateAnyType } from "./utils/discriminateAnyType.ts";
import { formatReportedType } from "./utils/formatReportedType.ts";
import { isUnsafeAssignment } from "./utils/isUnsafeAssignment.ts";

function isIntrinsicErrorType(type: Type): boolean {
	return type.isIntrinsicType() && type.intrinsicName === "error";
}

function isTypeAny(type: Type): boolean {
	return isTypeFlagSet(type, TypeFlags.Any) && !isIntrinsicErrorType(type);
}

function isTypeAnyArray(type: Type, typeChecker: Checker): boolean {
	if (!typeChecker.isArrayType(type)) {
		return false;
	}
	const typeArgs = typeChecker.getTypeArguments(type as TypeReference);
	const elementType = typeArgs[0];
	return elementType !== undefined && isTypeAny(elementType);
}

function isTypeAnyOrUnknown(type: Type): boolean {
	return isTypeFlagSet(type, TypeFlags.Any | TypeFlags.Unknown);
}

function isTypeFlagSet(type: Type, flags: TypeFlags): boolean {
	return (type.flags & flags) !== 0;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports assigning a value with type `any` to variables and properties.",
		id: "anyAssignments",
		presets: ["logical", "logicalStrict"],
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
			primary: "Unsafe assignment of a value of type `{{ type }}`.",
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
			senderType: Type,
			sourceFile: AST.SourceFile,
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

			const tupleElements = typeChecker.getTypeArguments(
				senderType as TypeReference,
			);
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
				if (!name) {
					continue;
				}

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
			senderType: Type,
			sourceFile: AST.SourceFile,
			typeChecker: Checker,
		): boolean {
			let didReport = false;

			for (const element of pattern.elements) {
				if (element.dotDotDotToken) {
					continue;
				}

				let key: string | undefined;
				const propertyName = element.propertyName ?? element.name;
				if (!propertyName) {
					continue;
				}

				if (
					ts.isIdentifier(propertyName) ||
					ts.isStringLiteral(propertyName) ||
					ts.isNumericLiteral(propertyName)
				) {
					key = propertyName.text;
				} else if (ts.isComputedPropertyName(propertyName)) {
					const expression = propertyName.expression;
					if (
						ts.isStringLiteral(expression) ||
						ts.isNoSubstitutionTemplateLiteral(expression)
					) {
						key = expression.text;
					}
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
				if (!name) {
					continue;
				}

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
			senderType: Type,
			sourceFile: AST.SourceFile,
			typeChecker: Checker,
		): boolean {
			return checkArrayDestructureWorker(
				pattern,
				senderType,
				sourceFile,
				typeChecker,
			);
		}

		function checkObjectDestructure(
			pattern: AST.ObjectBindingPattern,
			senderType: Type,
			sourceFile: AST.SourceFile,
			typeChecker: Checker,
		): boolean {
			return checkObjectDestructureWorker(
				pattern,
				senderType,
				sourceFile,
				typeChecker,
			);
		}

		function checkAssignment(
			initializerType: Type,
			declaredType: Type | undefined,
			initializer: AST.Expression,
			reportNode: AST.AnyNode,
			sourceFile: AST.SourceFile,
			typeChecker: Checker,
		): boolean {
			if (isIntrinsicErrorType(initializerType)) {
				return false;
			}

			const anyType = discriminateAnyType(
				initializerType,
				typeChecker,
				initializer,
			);

			if (declaredType === undefined) {
				if (anyType !== AnyType.Safe) {
					context.report({
						data: {
							type: anyType,
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
				initializer,
				typeChecker,
			);
			if (!result) {
				return false;
			}

			context.report({
				data: {
					receiver: formatReportedType(result.receiver, typeChecker),
					sender: formatReportedType(result.sender, typeChecker),
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
						if (element.kind !== SyntaxKind.SpreadElement) {
							continue;
						}

						const spreadType = typeChecker.getTypeAtLocation(
							element.expression,
						);
						if (!typeChecker.isArrayType(spreadType)) {
							continue;
						}

						const spreadTypeArgs = typeChecker.getTypeArguments(
							spreadType as TypeReference,
						);
						const spreadElementType = spreadTypeArgs[0];
						if (!spreadElementType || !isTypeAny(spreadElementType)) {
							continue;
						}

						const parentType = typeChecker.getContextualType(node);
						if (!parentType || !typeChecker.isArrayType(parentType)) {
							continue;
						}

						const parentTypeArgs = typeChecker.getTypeArguments(
							parentType as TypeReference,
						);
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
				Parameter: (node, { sourceFile, typeChecker }) => {
					if (!node.initializer) {
						return;
					}

					const initializerType = typeChecker.getTypeAtLocation(
						node.initializer,
					);

					if (node.name.kind === SyntaxKind.ArrayBindingPattern) {
						checkArrayDestructure(
							node.name,
							initializerType,
							sourceFile,
							typeChecker,
						);
						return;
					}

					if (node.name.kind === SyntaxKind.ObjectBindingPattern) {
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
					);
				},

				PropertyAssignment: (node, { sourceFile, typeChecker }) => {
					const initializerType = typeChecker.getTypeAtLocation(
						node.initializer,
					);

					if (!isTypeAny(initializerType)) {
						return;
					}

					const contextualType = typeChecker.getContextualType(
						node.parent as AST.Expression,
					);
					if (!contextualType) {
						return;
					}

					// TODO: Use a util like getStaticValue
					// https://github.com/flint-fyi/flint/issues/1298
					let key: string | undefined;

					if (
						node.name.kind === SyntaxKind.Identifier ||
						node.name.kind === SyntaxKind.StringLiteral ||
						node.name.kind === SyntaxKind.NumericLiteral
					) {
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
						data: { type: "any" },
						message: "unsafeAssignment",
						range: {
							begin: node.getStart(sourceFile),
							end: node.getEnd(),
						},
					});
				},
				PropertyDeclaration: (node, { sourceFile, typeChecker }) => {
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
					);
				},
				ShorthandPropertyAssignment: (node, { sourceFile, typeChecker }) => {
					const initializerType = typeChecker.getTypeAtLocation(node.name);

					if (!isTypeAny(initializerType)) {
						return;
					}

					const contextualType = typeChecker.getContextualType(
						node.parent as AST.Expression,
					);
					if (!contextualType) {
						return;
					}

					const propertySymbol = contextualType.getProperty(
						(node.name as AST.Identifier).text,
					);
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
						data: { type: "any" },
						message: "unsafeAssignment",
						range: {
							begin: node.getStart(sourceFile),
							end: node.getEnd(),
						},
					});
				},
				VariableDeclaration: (node, { sourceFile, typeChecker }) => {
					if (!node.initializer) {
						return;
					}

					const initializerType = typeChecker.getTypeAtLocation(
						node.initializer,
					);

					if (node.name.kind === SyntaxKind.ArrayBindingPattern) {
						checkArrayDestructure(
							node.name,
							initializerType,
							sourceFile,
							typeChecker,
						);
						return;
					}

					if (node.name.kind === SyntaxKind.ObjectBindingPattern) {
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
					);
				},
			},
		};
	},
});
