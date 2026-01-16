import {
	type AST,
	getTSNodeRange,
	isGlobalDeclarationOfName,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function hasCallbackArgument(callExpression: AST.CallExpression) {
	if (callExpression.arguments.length === 0) {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const firstArgument = callExpression.arguments[0]!;

	return (
		ts.isArrowFunction(firstArgument) ||
		ts.isFunctionExpression(firstArgument) ||
		(ts.isIdentifier(firstArgument) && firstArgument.text !== "undefined")
	);
}

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function isNumericLiteral(node: ts.Expression) {
	if (ts.isNumericLiteral(node)) {
		return true;
	}

	if (ts.isPrefixUnaryExpression(node)) {
		return (
			(node.operator === ts.SyntaxKind.MinusToken ||
				node.operator === ts.SyntaxKind.PlusToken) &&
			ts.isNumericLiteral(node.operand)
		);
	}

	return false;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports array methods with callbacks that will never be invoked on arrays with empty slots.",
		id: "arrayEmptyCallbackSlots",
		presets: ["logical"],
	},
	messages: {
		neverInvoked: {
			primary: "This callback will not be invoked.",
			secondary: [
				"When the Array constructor is called with a single number argument, it creates an array with empty slots (not actual undefined values).",
				"Callback methods like `map`, `filter`, `forEach`, etc. skip empty slots, so the callback will never run.",
			],
			suggestions: [
				"Use `Array.from({ length: n }, callback)` instead.",
				"Use `new Array(n).fill(undefined).map(callback)` to fill slots first.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					if (!ts.isPropertyAccessExpression(node.expression)) {
						return;
					}

					const objectExpression = node.expression.expression;

					if (
						!ts.isNewExpression(objectExpression) ||
						!ts.isIdentifier(objectExpression.expression) ||
						!isGlobalDeclarationOfName(
							objectExpression.expression,
							"Array",
							typeChecker,
						)
					) {
						return;
					}

					const args = objectExpression.arguments;
					if (args?.length !== 1) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const firstArgument = args[0]!;
					if (!isNumericLiteral(firstArgument) || !hasCallbackArgument(node)) {
						return;
					}

					context.report({
						message: "neverInvoked",
						range: getTSNodeRange(node.expression.name, sourceFile),
					});
				},
			},
		};
	},
});
