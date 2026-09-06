import {
	isIdentifier,
	isPropertyAccessExpression,
} from "typescript-native/unstable/ast";

import {
	getTSNodeRange,
	isGlobalDeclaration,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { isASTExpression } from "./typeGuards.ts";

const globalNames = new Set(["alert", "confirm", "prompt"]);

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports uses of the global alert/confirm/prompt dialog APIs.",
		id: "alerts",
		presets: ["logical"],
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
		function getCalleeNameAndNode(node: AST.Node) {
			if (isIdentifier(node)) {
				return { name: node.text, node };
			}

			if (isPropertyAccessExpression(node)) {
				const { expression, name } = node;
				if (!isIdentifier(name) || !isIdentifier(expression)) {
					return undefined;
				}

				return { name: name.text, node: name };
			}

			return undefined;
		}

		return {
			visitors: {
				CallExpression(node, { typeChecker, program, sourceFile }) {
					if (!isASTExpression(node.expression)) {
						return;
					}

					const found = getCalleeNameAndNode(node.expression);
					if (found === undefined) {
						return;
					}

					const { name, node: nodeToReport } = found;
					if (
						!globalNames.has(name) ||
						!isGlobalDeclaration(nodeToReport, typeChecker, program)
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
