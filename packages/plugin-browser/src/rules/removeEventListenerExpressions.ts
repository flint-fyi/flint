import {
	getTSNodeRange,
	isGlobalDeclaration,
	typescriptLanguage,
} from "@flint.fyi/ts";
import { nullThrows } from "@flint.fyi/utils";
import { SyntaxKind } from "typescript";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Disallow inline function expressions in removeEventListener calls.",
		id: "removeEventListenerExpressions",
		preset: "logical",
	},
	messages: {
		invalidRemoveEventListener: {
			primary:
				"Inline function expressions in `removeEventListener` calls will not remove the original listener.",
			secondary: [
				"The removeEventListener method requires the exact same function reference that was passed to addEventListener.",
				"Inline arrow functions and function expressions create new function instances each time, so they cannot match the original listener.",
				"Store the listener in a variable and use that reference for both addEventListener and removeEventListener.",
			],
			suggestions: [
				"Store the listener function in a variable",
				"Use the same function reference that was passed to addEventListener",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression(node, { sourceFile, typeChecker }) {
					if (
						node.expression.kind !== SyntaxKind.PropertyAccessExpression ||
						node.expression.name.kind !== SyntaxKind.Identifier ||
						node.expression.name.text !== "removeEventListener" ||
						node.arguments.length < 2 ||
						!isGlobalDeclaration(node.expression, typeChecker)
					) {
						return;
					}

					const listener = nullThrows(
						node.arguments[1],
						"Second argument is expected to be present by prior length check",
					);
					if (
						listener.kind !== SyntaxKind.ArrowFunction &&
						listener.kind !== SyntaxKind.FunctionExpression
					) {
						return;
					}

					context.report({
						message: "invalidRemoveEventListener",
						range: getTSNodeRange(listener, sourceFile),
					});
				},
			},
		};
	},
});
