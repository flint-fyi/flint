import {
	type AST,
	type Checker,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/ts";
import { isGlobalVariable } from "@flint.fyi/ts";
import { SyntaxKind } from "typescript";

const windowLikeNames = new Set([
	"globalThis",
	"parent",
	"self",
	"top",
	"window",
]);

export default typescriptLanguage.createRule({
	about: {
		description:
			"Requires specifying the targetOrigin argument when calling window.postMessage().",
		id: "windowMessagingTargetOrigin",
		preset: "logical",
	},
	messages: {
		missingTargetOrigin: {
			primary:
				"This `postMessage()` call is missing the required `targetOrigin` argument.",
			secondary: [
				"Calling window.postMessage() without a targetOrigin argument prevents the message from being received by any window.",
				"Always specify a target origin (for example, 'https://example.com' or '*' for any origin) as the second argument.",
			],
			suggestions: [
				"Add a targetOrigin as the second argument (e.g., window.postMessage(message, 'https://example.com'))",
			],
		},
	},
	setup(context) {
		function isWindowLikeIdentifier(
			node: AST.LeftHandSideExpression,
			typeChecker: Checker,
		): boolean {
			return (
				node.kind === SyntaxKind.Identifier &&
				windowLikeNames.has(node.text) &&
				isGlobalVariable(node, typeChecker)
			);
		}

		return {
			visitors: {
				CallExpression(node, { sourceFile, typeChecker }) {
					if (
						node.arguments.length < 2 &&
						node.expression.kind === SyntaxKind.PropertyAccessExpression &&
						node.expression.name.kind === SyntaxKind.Identifier &&
						node.expression.name.text === "postMessage" &&
						isWindowLikeIdentifier(node.expression.expression, typeChecker)
					) {
						context.report({
							message: "missingTargetOrigin",
							range: getTSNodeRange(node.expression.name, sourceFile),
						});
					}
				},
			},
		};
	},
});
