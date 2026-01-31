import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { isInBooleanContext } from "./utils/isInBooleanContext.ts";

function getNodeText(node: ts.Node, sourceFile: AST.SourceFile) {
	return sourceFile.text.slice(node.getStart(sourceFile), node.getEnd());
}

// TODO: This should make sure the Boolean is the global one...
function isBooleanCall(node: ts.CallExpression) {
	return ts.isIdentifier(node.expression) && node.expression.text === "Boolean";
}

function isDoubleNegation(
	node: ts.PrefixUnaryExpression,
): node is typeof node & { operand: AST.PrefixUnaryExpression } {
	if (node.operator !== ts.SyntaxKind.ExclamationToken) {
		return false;
	}

	const operand = node.operand;
	if (
		ts.isPrefixUnaryExpression(operand) &&
		operand.operator === ts.SyntaxKind.ExclamationToken
	) {
		return true;
	}

	return false;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports unnecessary boolean casts.",
		id: "unnecessaryBooleanCasts",
		presets: ["logical"],
	},
	messages: {
		unnecessary: {
			primary:
				"Casting this value to a boolean is unnecessary in this context.",
			secondary: [
				"The value is already in a boolean context.",
				"Using `{{ cast }}` to cast it does not change program behavior.",
			],
			suggestions: ["Remove the `{{ cast }}` call."],
		},
	},
	setup(context) {
		function reportCast(
			cast: string,
			outer: AST.AnyNode,
			inner: AST.AnyNode,
			sourceFile: AST.SourceFile,
		) {
			const range = getTSNodeRange(outer, sourceFile);

			context.report({
				data: { cast },
				fix: {
					range,
					text: getNodeText(inner, sourceFile),
				},
				message: "unnecessary",
				range,
			});
		}

		return {
			visitors: {
				CallExpression(node: AST.CallExpression, { sourceFile }) {
					if (!isBooleanCall(node) || !isInBooleanContext(node)) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const argument = node.arguments[0]!;

					reportCast("Boolean()", node, argument, sourceFile);
				},
				PrefixUnaryExpression(node: AST.PrefixUnaryExpression, { sourceFile }) {
					if (!isDoubleNegation(node) || !isInBooleanContext(node)) {
						return;
					}

					reportCast("!!", node, node.operand.operand, sourceFile);
				},
			},
		};
	},
});
