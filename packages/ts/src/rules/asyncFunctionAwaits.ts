import * as tsutils from "ts-api-utils";
import * as ts from "typescript";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports async functions that do not use await.",
		id: "asyncFunctionAwaits",
		presets: ["logicalStrict"],
	},
	messages: {
		missingAwait: {
			primary:
				"This function is marked `async` but does not contain an `await` expression or return a Promise.",
			secondary: [
				"Async functions always wrap their return value in a Promise, which adds overhead if you're not using await.",
				"This may indicate incomplete implementation or leftover code after refactoring.",
			],
			suggestions: [
				"Add an `await` expression if you need to wait for asynchronous operations.",
				"Remove the `async` keyword if the function doesn't need to be asynchronous.",
			],
		},
	},
	setup(context) {
		function checkFunction(
			node:
				| AST.ArrowFunction
				| AST.FunctionDeclaration
				| AST.FunctionExpression
				| AST.MethodDeclaration,
			{ sourceFile, typeChecker }: TypeScriptFileServices,
		) {
			const asyncModifier = node.modifiers?.find(
				(modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword,
			);

			if (
				!asyncModifier ||
				node.asteriskToken ||
				!node.body ||
				isEmptyBody(node.body) ||
				checkForAwait(node.body) ||
				bodyReturnsThenable(node.body, typeChecker)
			) {
				return;
			}

			context.report({
				message: "missingAwait",
				range: getTSNodeRange(asyncModifier, sourceFile),
			});
		}

		return {
			visitors: {
				ArrowFunction: checkFunction,
				FunctionDeclaration: checkFunction,
				FunctionExpression: checkFunction,
				MethodDeclaration: checkFunction,
			},
		};
	},
});

function bodyReturnsThenable(
	body: ts.Block | ts.Expression,
	typeChecker: ts.TypeChecker,
) {
	if (!ts.isBlock(body)) {
		return tsutils.isThenableType(typeChecker, body);
	}

	function checkReturnStatements(node: ts.Node): boolean | undefined {
		if (
			ts.isReturnStatement(node) &&
			node.expression &&
			tsutils.isThenableType(typeChecker, node.expression)
		) {
			return true;
		}

		if (tsutils.isFunctionScopeBoundary(node)) {
			return false;
		}

		return ts.forEachChild(node, checkReturnStatements);
	}

	return ts.forEachChild(body, checkReturnStatements);
}

// TODO: Use a scope analyzer (#400)?
function checkForAwait(node: ts.Node): boolean | undefined {
	if (ts.isAwaitExpression(node)) {
		return true;
	}

	if (ts.isForOfStatement(node) && node.awaitModifier) {
		return true;
	}

	if (tsutils.isFunctionScopeBoundary(node)) {
		return false;
	}

	return ts.forEachChild(node, checkForAwait);
}

function isEmptyBody(body: ts.Block | ts.Expression) {
	return ts.isBlock(body) && !body.statements.length;
}
