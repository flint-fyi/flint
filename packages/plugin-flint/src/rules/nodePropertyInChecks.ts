import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

import { isTSNode } from "../utils/isTSNode.ts";
import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Disallows using the `in` operator to check properties on TypeScript nodes.",
		id: "nodePropertyInChecks",
		presets: ["logical"],
	},
	messages: {
		nodePropertyInChecks: {
			primary:
				"Avoid using the `in` operator to check properties on TypeScript nodes.",
			secondary: [
				"The `in` operator checks inherited properties and may not work reliably with TypeScript AST nodes.",
				"TypeScript AST nodes have complex prototype chains that can lead to unexpected results with `in` checks.",
			],
			suggestions: [
				"Access the property directly or use a type guard function like `ts.isXXX()` instead.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				BinaryExpression(node, { sourceFile, typeChecker }) {
					if (
						node.operatorToken.kind == SyntaxKind.InKeyword &&
						isTSNode(node.right, typeChecker)
					) {
						context.report({
							message: "nodePropertyInChecks",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
			},
		};
	},
});
