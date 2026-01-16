import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as tsutils from "ts-api-utils";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function getPropertyName(
	accessor: AST.GetAccessorDeclaration | AST.SetAccessorDeclaration,
	sourceFile: AST.SourceFile,
) {
	return ts.isIdentifier(accessor.name) ||
		ts.isStringLiteral(accessor.name) ||
		ts.isNumericLiteral(accessor.name)
		? accessor.name.text
		: accessor.name.getText(sourceFile);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports recursive access to this within getters and setters.",
		id: "accessorThisRecursion",
		presets: ["logical"],
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
			const isGetter = ts.isGetAccessorDeclaration(accessor);

			function checkNode(node: ts.Node): void {
				if (tsutils.isFunctionScopeBoundary(node)) {
					return;
				}

				if (ts.isPropertyAccessExpression(node)) {
					checkPropertyAccessExpression(node);
				}

				ts.forEachChild(node, checkNode);
			}

			function checkPropertyAccessExpression(
				node: ts.PropertyAccessExpression,
			) {
				if (
					node.name.text !== propertyName ||
					node.expression.kind !== ts.SyntaxKind.ThisKeyword
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
					ts.isBinaryExpression(node.parent) &&
					node.parent.left === node &&
					node.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken
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
			ts.forEachChild(accessor.body, checkNode);
		}

		return {
			visitors: {
				GetAccessor: checkAccessor,
				SetAccessor: checkAccessor,
			},
		};
	},
});
