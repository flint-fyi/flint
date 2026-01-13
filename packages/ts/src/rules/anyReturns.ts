import { nullThrows } from "@flint.fyi/utils";
import * as tsutils from "ts-api-utils";
import ts, { SyntaxKind } from "typescript";

import { typescriptLanguage } from "../language.ts";
import type * as AST from "../types/ast.ts";
import type { Checker } from "../types/checker.ts";
import { AnyType, discriminateAnyType } from "./utils/discriminateAnyType.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";
import { getThisExpression } from "./utils/getThisExpression.ts";
import { isUnsafeAssignment } from "./utils/isUnsafeAssignment.ts";

export default typescriptLanguage.createRule({
	about: {
		description: "Reports returning a value with type `any` from a function.",
		id: "anyReturns",
		preset: "logical",
	},
	messages: {
		unsafeReturn: {
			primary: "Unsafe return of a value of type {{ type }}.",
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
			reportingNode: ts.Node,
			program: ts.Program,
			typeChecker: Checker,
		): void {
			const type = typeChecker.getTypeAtLocation(returnNode);

			const anyType = discriminateAnyType(
				type,
				typeChecker,
				program,
				returnNode,
			);
			const functionNode = ts.findAncestor(
				returnNode,
				// TODO: I believe isFunctionLikeDeclaration was incorrectly marked
				// as deprecated in https://github.com/JoshuaKGoldberg/ts-api-utils/pull/124
				// It says "With TypeScript v5, in favor of typescript's `isFunctionLike`."
				// However, isFunctionLike also checks for signature-like nodes,
				// whereas isFunctionLikeDeclaration checks only for function-like nodes.
				/* eslint-disable @typescript-eslint/no-deprecated */
				// flint-disable-lines-begin deprecated
				tsutils.isFunctionLikeDeclaration,
				/* eslint-enable @typescript-eslint/no-deprecated */
				// flint-disable-lines-end deprecated
			);
			if (!functionNode) {
				return;
			}

			// function has an explicit return type, so ensure it's a safe return
			const returnNodeType = getConstrainedTypeAtLocation(
				returnNode,
				typeChecker,
			);

			// function expressions will not have their return type modified based on receiver typing
			// so we have to use the contextual typing in these cases, i.e.
			// const foo1: () => Set<string> = () => new Set<any>();
			// the return type of the arrow function is Set<any> even though the variable is typed as Set<string>
			let functionType =
				functionNode.kind == SyntaxKind.FunctionExpression ||
				functionNode.kind == SyntaxKind.ArrowFunction
					? typeChecker.getContextualType(functionNode)
					: typeChecker.getTypeAtLocation(functionNode);
			functionType ??= typeChecker.getTypeAtLocation(functionNode);
			const callSignatures = tsutils.getCallSignaturesOfType(functionType);
			// If there is an explicit type annotation *and* that type matches the actual
			// function return type, we shouldn't complain (it's intentional, even if unsafe)
			if (functionNode.type) {
				for (const signature of callSignatures) {
					const signatureReturnType = signature.getReturnType();

					if (
						returnNodeType === signatureReturnType ||
						tsutils.isTypeFlagSet(
							signatureReturnType,
							ts.TypeFlags.Any | ts.TypeFlags.Unknown,
						)
					) {
						return;
					}
					if (
						tsutils.includesModifier(
							functionNode.modifiers,
							SyntaxKind.AsyncKeyword,
						)
					) {
						const awaitedSignatureReturnType =
							typeChecker.getAwaitedType(signatureReturnType);

						const awaitedReturnNodeType =
							typeChecker.getAwaitedType(returnNodeType);
						if (
							awaitedReturnNodeType === awaitedSignatureReturnType ||
							(awaitedSignatureReturnType &&
								tsutils.isTypeFlagSet(
									awaitedSignatureReturnType,
									ts.TypeFlags.Any | ts.TypeFlags.Unknown,
								))
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
						anyType === AnyType.Any &&
						tsutils.isTypeFlagSet(functionReturnType, ts.TypeFlags.Unknown)
					) {
						return;
					}
					if (
						anyType === AnyType.AnyArray &&
						typeChecker.isArrayType(functionReturnType) &&
						tsutils.isTypeFlagSet(
							nullThrows(
								typeChecker.getTypeArguments(functionReturnType)[0],
								"Array type should have at least one type argument",
							),
							ts.TypeFlags.Unknown,
						)
					) {
						return;
					}
					const awaitedType = typeChecker.getAwaitedType(functionReturnType);
					if (
						awaitedType &&
						anyType === AnyType.PromiseAny &&
						tsutils.isTypeFlagSet(awaitedType, ts.TypeFlags.Unknown)
					) {
						return;
					}
				}

				if (
					anyType === AnyType.PromiseAny &&
					!tsutils.includesModifier(
						functionNode.modifiers,
						SyntaxKind.AsyncKeyword,
					)
				) {
					return;
				}

				let message: "unsafeReturn" | "unsafeReturnThis" = "unsafeReturn";
				const isErrorType = tsutils.isIntrinsicErrorType(returnNodeType);

				if (
					!tsutils.isStrictCompilerOptionEnabled(
						program.getCompilerOptions(),
						"noImplicitThis",
					)
				) {
					// `return this`
					const thisExpression = getThisExpression(returnNode);
					if (
						thisExpression &&
						tsutils.isTypeFlagSet(
							getConstrainedTypeAtLocation(thisExpression, typeChecker),
							ts.TypeFlags.Any,
						)
					) {
						message = "unsafeReturnThis";
					}
				}

				// If the function return type was not unknown/unknown[], mark usage as unsafeReturn.
				context.report({
					data: {
						type: isErrorType
							? "error"
							: anyType === AnyType.Any
								? "`any`"
								: anyType === AnyType.PromiseAny
									? "`Promise<any>`"
									: "`any[]`",
					},
					message,
					range: {
						begin: reportingNode.getStart(),
						end: reportingNode.getEnd(),
					},
				});
				return;
			}

			const signature = functionType.getCallSignatures().at(0);
			if (signature) {
				const functionReturnType = signature.getReturnType();
				const result = isUnsafeAssignment(
					returnNodeType,
					functionReturnType,
					typeChecker,
					returnNode,
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
					range: {
						begin: reportingNode.getStart(),
						end: reportingNode.getEnd(),
					},
				});
				return;
			}
		}

		return {
			visitors: {
				ArrowFunction: (node, { program, typeChecker }) => {
					if (node.body.kind != SyntaxKind.Block) {
						checkReturn(node.body, node.body, program, typeChecker);
					}
				},
				ReturnStatement: (node, { program, typeChecker }) => {
					if (node.expression != null) {
						checkReturn(node.expression, node, program, typeChecker);
					}
				},
			},
		};
	},
});
