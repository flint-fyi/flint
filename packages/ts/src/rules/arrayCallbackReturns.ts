import * as tsutils from "ts-api-utils";
import { SyntaxKind } from "typescript";

import {
	forEachChild,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

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

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports missing return statements in callbacks of array methods.",
		id: "arrayCallbackReturns",
		presets: ["javascript"],
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
					if (node.expression.kind !== SyntaxKind.PropertyAccessExpression) {
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

function getCallbackBody(node: AST.AnyNode): AST.Block | undefined {
	if (node.kind === SyntaxKind.ArrowFunction) {
		return node.body.kind === SyntaxKind.Block ? node.body : undefined;
	}

	if (node.kind === SyntaxKind.FunctionExpression) {
		return node.body;
	}

	return undefined;
}

function hasReturnWithValue(block: AST.Block): boolean {
	let hasReturn = false;

	function visit(node: AST.AnyNode): void {
		if (hasReturn) {
			return;
		}

		if (node.kind === SyntaxKind.ReturnStatement && node.expression) {
			hasReturn = true;
			return;
		}

		if (tsutils.isFunctionScopeBoundary(node)) {
			return;
		}

		forEachChild(node, visit);
	}

	forEachChild(block, visit);
	return hasReturn;
}
