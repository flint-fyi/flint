import {
	type AST,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as tsutils from "ts-api-utils";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { forEachReturnStatement } from "./utils/forEachReturnStatement.ts";

type ClassLikeDeclaration = AST.ClassDeclaration | AST.ClassExpression;

type FunctionLike =
	| AST.ArrowFunction
	| AST.FunctionExpression
	| AST.GetAccessorDeclaration
	| AST.MethodDeclaration;

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Enforce that `this` is used when only `this` type is returned.",
		id: "returnThisTypes",
		presets: ["logical"],
	},
	messages: {
		preferThis: {
			primary:
				"Prefer `this` as the return type instead of the class name for polymorphic chaining.",
			secondary: [
				"Annotating this method as returning the class extends to sub-classes as well.",
				"Any sub-class will be implicitly typed as returning this parent class, rather than itself.",
				"Using `this` preserves method chaining behavior in subclasses.",
			],
			suggestions: ["Replace the class name with `this`."],
		},
	},
	setup(context) {
		function checkFunction(
			functionNode: FunctionLike,
			originalClassNode: AST.AnyNode,
			{ sourceFile, typeChecker }: TypeScriptFileServices,
		) {
			if (
				originalClassNode.kind !== ts.SyntaxKind.ClassDeclaration &&
				originalClassNode.kind !== ts.SyntaxKind.ClassExpression
			) {
				return;
			}

			const className = originalClassNode.name?.text;
			if (!className || !functionNode.type) {
				return;
			}

			const nameNode = tryGetNameInType(className, functionNode.type);
			if (
				!nameNode ||
				!isFunctionReturningThis(functionNode, originalClassNode, typeChecker)
			) {
				return;
			}

			const range = getTSNodeRange(nameNode, sourceFile);

			context.report({
				fix: {
					range,
					text: "this",
				},
				message: "preferThis",
				range,
			});
		}

		function isFunctionReturningThis(
			functionNode: FunctionLike,
			originalClassNode: ClassLikeDeclaration,
			typeChecker: ts.TypeChecker,
		) {
			if (!functionNode.body || isThisSpecifiedInParameters(functionNode)) {
				return false;
			}

			const classType = typeChecker.getTypeAtLocation(
				originalClassNode,
			) as ts.InterfaceType;

			if (functionNode.body.kind !== ts.SyntaxKind.Block) {
				return (
					classType.thisType ===
					typeChecker.getTypeAtLocation(functionNode.body)
				);
			}

			let hasReturnThis = false;
			let hasReturnClassType = false;

			forEachReturnStatement(functionNode.body, (statement) => {
				if (!statement.expression) {
					return;
				}

				if (statement.expression.kind === ts.SyntaxKind.ThisKeyword) {
					hasReturnThis = true;
					return;
				}

				const type = typeChecker.getTypeAtLocation(statement.expression);
				if (classType === type) {
					hasReturnClassType = true;
					return true;
				}

				if (classType.thisType === type) {
					hasReturnThis = true;
					return;
				}

				if (tsutils.isUnionType(type) && type.types.includes(classType)) {
					hasReturnClassType = true;
					return true;
				}
			});

			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			return !hasReturnClassType && hasReturnThis;
		}

		function isThisSpecifiedInParameters(functionNode: FunctionLike) {
			if (!functionNode.parameters.length) {
				return false;
			}

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const firstArgument = functionNode.parameters[0]!;

			return (
				ts.isIdentifier(firstArgument.name) &&
				firstArgument.name.text === "this"
			);
		}

		function tryGetNameInType(
			name: string,
			typeNode: ts.TypeNode,
		): ts.TypeReferenceNode | undefined {
			if (
				ts.isTypeReferenceNode(typeNode) &&
				ts.isIdentifier(typeNode.typeName) &&
				typeNode.typeName.text === name
			) {
				return typeNode;
			}

			if (ts.isUnionTypeNode(typeNode)) {
				for (const type of typeNode.types) {
					const found = tryGetNameInType(name, type);
					if (found) {
						return found;
					}
				}
			}

			return undefined;
		}

		function checkMethodLike(
			node: AST.GetAccessorDeclaration | AST.MethodDeclaration,
			services: TypeScriptFileServices,
		) {
			checkFunction(node, node.parent, services);
		}

		return {
			visitors: {
				GetAccessor: checkMethodLike,
				MethodDeclaration: checkMethodLike,
				PropertyDeclaration(
					node: AST.PropertyDeclaration,
					services: TypeScriptFileServices,
				) {
					if (
						node.initializer &&
						(ts.isFunctionExpression(node.initializer) ||
							ts.isArrowFunction(node.initializer))
					) {
						checkFunction(node.initializer, node.parent, services);
					}
				},
			},
		};
	},
});
