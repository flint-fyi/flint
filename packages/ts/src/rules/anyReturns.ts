import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";
import {
	isFunctionLikeDeclaration,
	SyntaxKind,
} from "@flint.fyi/typescript-language/native/ast";
import {
	TypeFlags,
	type TypeReference,
} from "@flint.fyi/typescript-language/native/sync";
import { nullThrows } from "@flint.fyi/utils";

import { ruleCreator } from "./ruleCreator.ts";
import { AnyType, discriminateAnyType } from "./utils/discriminateAnyType.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";
import { isUnsafeAssignment } from "./utils/isUnsafeAssignment.ts";
import { getUnionConstituents } from "./utils/typeConstituents.ts";

function findFunctionAncestor(
	node: AST.AnyNode,
): AST.FunctionLikeDeclaration | undefined {
	for (
		let current = node.parent;
		current.kind !== SyntaxKind.SourceFile;
		current = current.parent
	) {
		if (isFunctionLikeDeclaration(current)) {
			return current;
		}
	}

	return undefined;
}

function getThisExpression(
	node: AST.Expression,
): AST.ThisExpression | undefined {
	while (
		node.kind === SyntaxKind.CallExpression ||
		node.kind === SyntaxKind.ElementAccessExpression ||
		node.kind === SyntaxKind.ParenthesizedExpression ||
		node.kind === SyntaxKind.PropertyAccessExpression
	) {
		node = node.expression;
	}

	return node.kind === SyntaxKind.ThisKeyword ? node : undefined;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports returning a value with type `any` from a function.",
		id: "anyReturns",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		unsafeReturn: {
			primary: "Unsafe return of a value of type `{{ type }}`.",
			secondary: [
				"Returning a value of type `any` or a similar unsafe type defeats TypeScript's type safety guarantees.",
				"This can allow unexpected types to propagate through your codebase, potentially causing runtime errors.",
			],
			suggestions: [
				"Ensure the returned value has a well-defined, specific type.",
			],
		},
		unsafeReturnAssignment: {
			primary:
				"Unsafe return of type `{{ sender }}` from function with return type `{{ receiver }}`.",
			secondary: [
				"The function's declared return type does not safely accept the value being returned.",
				"This can allow unexpected types to propagate through your codebase, potentially causing runtime errors.",
			],
			suggestions: [
				"Adjust the return type of the function to match the returned value, if appropriate.",
				"Otherwise, refine the returned value to ensure it matches the expected return type.",
			],
		},
		unsafeReturnThis: {
			primary:
				"Unsafe return of a value of type `{{ type }}`. `this` is typed as `any`.",
			secondary: [
				"Returning `this` when it is implicitly typed as `any` introduces type-unsafe behavior.",
				"This can allow unexpected types to propagate through your codebase, potentially causing runtime errors.",
			],
			suggestions: [
				"Enable the `noImplicitThis` compiler option to enforce explicit `this` types.",
				"Add an explicit `this` parameter to the function to clarify its type.",
			],
		},
	},
	setup(context) {
		function checkReturn(
			returnNode: AST.Expression,
			reportingNode: AST.AnyNode,
			{ program, sourceFile, typeChecker }: TypeScriptFileServices,
		): void {
			const type = typeChecker.getTypeAtLocation(returnNode);
			const functionNode = findFunctionAncestor(returnNode);
			if (!functionNode) {
				return;
			}

			// function has an explicit return type, so ensure it's a safe return
			const returnNodeType = getConstrainedTypeAtLocation(
				returnNode,
				typeChecker,
			);
			const anyType = returnNodeType.isErrorType()
				? AnyType.Error
				: discriminateAnyType(type, typeChecker);
			const isAsync = functionNode.modifiers?.some(
				(modifier) => modifier.kind === SyntaxKind.AsyncKeyword,
			);

			// function expressions will not have their return type modified based on receiver typing
			// so we have to use the contextual typing in these cases, i.e.
			// const foo1: () => Set<string> = () => new Set<any>();
			// the return type of the arrow function is Set<any> even though the variable is typed as Set<string>
			let functionType =
				functionNode.kind === SyntaxKind.FunctionExpression ||
				functionNode.kind === SyntaxKind.ArrowFunction
					? typeChecker.getContextualType(functionNode)
					: typeChecker.getTypeAtLocation(functionNode);
			functionType ??= typeChecker.getTypeAtLocation(functionNode);
			const callSignatures = getUnionConstituents(functionType).flatMap(
				(constituent) => constituent.getCallSignatures(),
			);
			// If there is an explicit type annotation *and* that type matches the actual
			// function return type, we shouldn't complain (it's intentional, even if unsafe)
			if (functionNode.type) {
				for (const signature of callSignatures) {
					const signatureReturnType = signature.getReturnType();

					if (
						returnNodeType.id === signatureReturnType.id ||
						signatureReturnType.flags & (TypeFlags.Any | TypeFlags.Unknown)
					) {
						return;
					}
					if (isAsync) {
						const awaitedSignatureReturnType =
							typeChecker.getAwaitedType(signatureReturnType);
						if (
							typeChecker.getAwaitedType(returnNodeType)?.id ===
								awaitedSignatureReturnType?.id ||
							(awaitedSignatureReturnType &&
								awaitedSignatureReturnType.flags &
									(TypeFlags.Any | TypeFlags.Unknown))
						) {
							return;
						}
					}
				}
			}

			if (anyType !== AnyType.Safe) {
				// Allow cases when the declared return type of the function is either unknown or unknown[]
				// and the function is returning any or any[].
				for (const signature of callSignatures) {
					const functionReturnType = signature.getReturnType();
					if (
						(anyType === AnyType.Any || anyType === AnyType.Error) &&
						functionReturnType.flags & TypeFlags.Unknown
					) {
						return;
					}
					if (
						anyType === AnyType.AnyArray &&
						typeChecker.isArrayType(functionReturnType) &&
						nullThrows(
							typeChecker.getTypeArguments(
								functionReturnType as TypeReference,
							)[0],
							"Array type should have at least one type argument",
						).flags & TypeFlags.Unknown
					) {
						return;
					}
					if (anyType !== AnyType.PromiseAny) {
						continue;
					}
					const awaitedType = typeChecker.getAwaitedType(functionReturnType);
					if (awaitedType && awaitedType.flags & TypeFlags.Unknown) {
						return;
					}
				}

				if (anyType === AnyType.PromiseAny && !isAsync) {
					return;
				}

				let message: "unsafeReturn" | "unsafeReturnThis" = "unsafeReturn";

				// noImplicitThis defaults to the value of strict, which is off by default
				const compilerOptions = program.getCompilerOptions();
				if (
					!(compilerOptions.noImplicitThis ?? compilerOptions.strict ?? false)
				) {
					// `return this`
					const thisExpression = getThisExpression(returnNode);
					if (
						thisExpression &&
						getConstrainedTypeAtLocation(thisExpression, typeChecker).flags &
							TypeFlags.Any
					) {
						message = "unsafeReturnThis";
					}
				}

				// If the function return type was not unknown/unknown[], mark usage as unsafeReturn.
				context.report({
					data: {
						type: anyType,
					},
					message,
					range: getTSNodeRange(reportingNode, sourceFile),
				});
				return;
			}

			const signature = functionType.getCallSignatures().at(0);
			if (signature) {
				const functionReturnType = signature.getReturnType();
				const result = isUnsafeAssignment(
					returnNodeType,
					functionReturnType,
					returnNode,
					typeChecker,
				);
				if (!result) {
					return;
				}

				const { receiver, sender } = result;
				context.report({
					data: {
						receiver: typeChecker.typeToString(receiver),
						sender: typeChecker.typeToString(sender),
					},
					message: "unsafeReturnAssignment",
					range: getTSNodeRange(reportingNode, sourceFile),
				});
				return;
			}
		}

		return {
			visitors: {
				ArrowFunction: (node, fileService) => {
					if (node.body.kind !== SyntaxKind.Block) {
						checkReturn(node.body, node.body, fileService);
					}
				},
				ReturnStatement: (node, fileService) => {
					if (node.expression != null) {
						checkReturn(node.expression, node, fileService);
					}
				},
			},
		};
	},
});
