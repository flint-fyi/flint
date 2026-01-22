import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Require using the optional chaining operator when possible.",
		id: "optionalChainOperators",
		presets: ["logical"],
	},
	messages: {
		preferOptionalChain: {
			primary:
				"Prefer the cleaner `?.` optional chaining operator over more verbose logical chains.",
			secondary: [
				"Optional chaining short-circuits safely on null and undefined, unlike logical operators that only short-circuit on falsy values.",
				"This makes the code more concise and safer.",
			],
			suggestions: ["Switch this logical chain to a `?.` optional chain."],
		},
	},
	setup(context) {
		return {
			visitors: {
				BinaryExpression: (node, { sourceFile }) => {
					// Check for patterns like: foo && foo.bar
					if (
						node.operatorToken.kind !== ts.SyntaxKind.AmpersandAmpersandToken
					) {
						return;
					}

					const leftText = getNodeText(node.left, sourceFile);
					const rightText = getNodeText(node.right, sourceFile);

					if (!leftText || !rightText) {
						return;
					}

					// Check if right side starts with left side
					// e.g., "foo" && "foo.bar"
					if (rightText.startsWith(leftText + ".") || rightText === leftText) {
						context.report({
							message: "preferOptionalChain",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
			},
		};
	},
});

function getNodeText(
	node: ts.Node,
	sourceFile: ts.SourceFile,
): string | undefined {
	try {
		return node.getText(sourceFile);
	} catch {
		return undefined;
	}
}
