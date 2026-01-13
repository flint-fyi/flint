import * as tsutils from "ts-api-utils";
import * as ts from "typescript";

import { typescriptLanguage } from "../language.ts";

const arrayMethodsRequiringReturn = new Set([
	"every",
	"filter",
	"find",
	"findIndex",
	"findLast",
	"findLastIndex",
	"flatMap",
	"map",
	"reduce",
	"reduceRight",
	"some",
	"sort",
	"toSorted",
]);

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports missing return statements in callbacks of array methods.",
		id: "arrayCallbackReturns",
		preset: "untyped",
	},
	messages: {
		missingReturn: {
			primary: "Array method `{{ method }}` callback expects a return value.",
			secondary: [
				"Array methods like `map`, `filter`, `find`, and `reduce` rely on return values from their callbacks.",
				"A missing return statement is often a mistake that causes the array method to produce unexpected results.",
			],
			suggestions: [
				"Add a return statement to the callback function.",
				"If you don't need the return value, consider using `forEach` instead.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile }) => {
					if (!ts.isPropertyAccessExpression(node.expression)) {
						return;
					}

					const methodName = node.expression.name.text;
					if (!arrayMethodsRequiringReturn.has(methodName)) {
						return;
					}

					const callback = node.arguments[0];
					if (!callback) {
						return;
					}

					const body = getCallbackBody(callback);
					if (!body) {
						return;
					}

					if (!hasReturnWithValue(body)) {
						context.report({
							data: { method: methodName },
							message: "missingReturn",
							range: {
								begin: callback.getStart(sourceFile),
								end: callback.getEnd(),
							},
						});
					}
				},
			},
		};
	},
});

function getCallbackBody(node: ts.Node): ts.Block | undefined {
	if (ts.isArrowFunction(node)) {
		return ts.isBlock(node.body) ? node.body : undefined;
	}

	if (ts.isFunctionExpression(node)) {
		return node.body;
	}

	return undefined;
}

function hasReturnWithValue(block: ts.Block): boolean {
	let hasReturn = false;

	function visit(node: ts.Node): void {
		if (hasReturn) {
			return;
		}

		if (ts.isReturnStatement(node) && node.expression) {
			hasReturn = true;
			return;
		}

		if (tsutils.isFunctionScopeBoundary(node)) {
			return;
		}

		ts.forEachChild(node, visit);
	}

	ts.forEachChild(block, visit);
	return hasReturn;
}
