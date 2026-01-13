import { type AST, getTSNodeRange, typescriptLanguage } from "@flint.fyi/ts";
import { isGlobalDeclaration } from "@flint.fyi/ts";
import { SyntaxKind } from "typescript";

const globalNames = new Set(["alert", "confirm", "prompt"]);

export default typescriptLanguage.createRule({
	about: {
		description: "Reports uses of the global alert/confirm/prompt dialog APIs.",
		id: "alerts",
		preset: "logical",
	},
	messages: {
		noAlert: {
			primary:
				"The global `{{ name }}()` API blocks the main thread and interrupts users.",
			secondary: [
				"These blocking dialog APIs provide a poor user experience and are not recommended for production code.",
				"Prefer non-blocking UI or console logging for debugging instead.",
			],
			suggestions: [
				"Replace with non-blocking UI (for example a modal) or use console logging for development.",
			],
		},
	},
	setup(context) {
		function getCalleeNameAndNode(node: AST.LeftHandSideExpression) {
			if (node.kind === SyntaxKind.Identifier) {
				return { name: node.text, node };
			}

			if (node.kind === SyntaxKind.PropertyAccessExpression) {
				const { expression, name } = node;
				if (
					name.kind !== SyntaxKind.Identifier ||
					expression.kind !== SyntaxKind.Identifier
				) {
					return undefined;
				}

				return { name: name.text, node: name };
			}

			return undefined;
		}

		return {
			visitors: {
				CallExpression(node, { sourceFile, typeChecker }) {
					const found = getCalleeNameAndNode(node.expression);
					if (found === undefined) {
						return;
					}

					const { name, node: nodeToReport } = found;
					if (
						!globalNames.has(name) ||
						!isGlobalDeclaration(nodeToReport, typeChecker)
					) {
						return;
					}

					context.report({
						data: { name },
						message: "noAlert",
						range: getTSNodeRange(nodeToReport, sourceFile),
					});
				},
			},
		};
	},
});
