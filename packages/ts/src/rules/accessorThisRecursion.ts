import {
	isClassLikeDeclaration,
	isFunctionLikeDeclaration,
	SyntaxKind,
} from "typescript-native/unstable/ast";

import {
	forEachChild,
	typescriptLanguage,
	type AST,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function getPropertyName(
	accessor: AST.GetAccessorDeclaration | AST.SetAccessorDeclaration,
	sourceFile: AST.SourceFile,
) {
	return accessor.name.kind === SyntaxKind.Identifier ||
		accessor.name.kind === SyntaxKind.StringLiteral ||
		accessor.name.kind === SyntaxKind.NumericLiteral
		? accessor.name.text
		: accessor.name.getText(sourceFile);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports recursive access to this within getters and setters.",
		id: "accessorThisRecursion",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		noGetterRecursion: {
			primary:
				"This getter recursively accesses its own property via `this`, causing infinite recursion.",
			secondary: [
				"Accessing `this.propertyName` inside a getter for `propertyName` triggers the getter again.",
				"This results in a stack overflow error at runtime.",
			],
			suggestions: [
				"Store the value in a private field and return that instead.",
				"Use a different backing property name.",
			],
		},
		noSetterRecursion: {
			primary:
				"This setter recursively assigns to its own property via `this`, causing infinite recursion.",
			secondary: [
				"Assigning to `this.propertyName` inside a setter for `propertyName` triggers the setter again.",
				"This results in a stack overflow error at runtime.",
			],
			suggestions: [
				"Store the value in a private field instead.",
				"Use a different backing property name.",
			],
		},
	},
	setup(context) {
		function checkAccessor(
			accessor: AST.GetAccessorDeclaration | AST.SetAccessorDeclaration,
			{ sourceFile }: TypeScriptFileServices,
		) {
			if (!accessor.body) {
				return;
			}

			const propertyName = getPropertyName(accessor, sourceFile);
			const isGetter = accessor.kind === SyntaxKind.GetAccessor;

			function checkNode(node: AST.AnyNode): void {
				// `this` inside a nested class or function refers to that scope's
				// own `this`, not the accessor's
				if (isClassLikeDeclaration(node) || isFunctionLikeDeclaration(node)) {
					return;
				}

				if (node.kind === SyntaxKind.PropertyAccessExpression) {
					checkPropertyAccessExpression(node);
				}

				forEachChild(node, checkNode);
			}

			function checkPropertyAccessExpression(
				node: AST.PropertyAccessExpression,
			) {
				if (
					node.name.text !== propertyName ||
					node.expression.kind !== SyntaxKind.ThisKeyword
				) {
					return;
				}

				if (isGetter) {
					context.report({
						message: "noGetterRecursion",
						range: {
							begin: node.getStart(sourceFile),
							end: node.getEnd(),
						},
					});
				} else if (
					node.parent.kind === SyntaxKind.BinaryExpression &&
					node.parent.left === node &&
					node.parent.operatorToken.kind === SyntaxKind.EqualsToken
				) {
					context.report({
						message: "noSetterRecursion",
						range: {
							begin: node.getStart(sourceFile),
							end: node.getEnd(),
						},
					});
				}
			}

			// TODO: This will be more clean when there is a scope manager
			// https://github.com/flint-fyi/flint/issues/400
			forEachChild(accessor.body, checkNode);
		}

		return {
			visitors: {
				GetAccessor: checkAccessor,
				SetAccessor: checkAccessor,
			},
		};
	},
});
