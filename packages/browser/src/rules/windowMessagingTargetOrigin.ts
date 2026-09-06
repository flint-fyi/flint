import {
	isIdentifier,
	isPropertyAccessExpression,
} from "typescript-native/unstable/ast";
import type { Program } from "typescript-native/unstable/sync";

import {
	getTSNodeRange,
	isGlobalVariable,
	typescriptLanguage,
	type AST,
	type Checker,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { isASTExpression } from "./typeGuards.ts";

const windowLikeNames = new Set([
	"globalThis",
	"parent",
	"self",
	"top",
	"window",
]);

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Requires specifying the targetOrigin argument when calling window.postMessage().",
		id: "windowMessagingTargetOrigin",
		presets: ["logical"],
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
			node: AST.Node,
			typeChecker: Checker,
			program: Program,
		): boolean {
			return (
				isIdentifier(node) &&
				windowLikeNames.has(node.text) &&
				isGlobalVariable(node, typeChecker, program)
			);
		}

		return {
			visitors: {
				CallExpression(node, { typeChecker, program, sourceFile }) {
					if (
						node.arguments.length < 2 &&
						isPropertyAccessExpression(node.expression) &&
						isIdentifier(node.expression.name) &&
						node.expression.name.text === "postMessage" &&
						isASTExpression(node.expression.expression) &&
						isWindowLikeIdentifier(
							node.expression.expression,
							typeChecker,
							program,
						)
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
