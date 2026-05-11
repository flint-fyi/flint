import {
	type AST,
	forEachChild,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as tsutils from "ts-api-utils";
import { SyntaxKind } from "typescript";

import { ruleCreator } from "../ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports using await expressions inside loops.",
		id: "loopAwaits",
		presets: ["logical"],
	},
	messages: {
		noAwaitInLoop: {
			primary:
				"Using await inside loops causes sequential execution instead of parallel execution.",
			secondary: [
				"Each iteration of the loop will wait for the previous iteration to complete before starting.",
				"This can significantly slow down your code if the awaited operations could be done in parallel.",
			],
			suggestions: [
				"Consider collecting promises in an array and using `Promise.all()` to await them in parallel.",
			],
		},
	},
	setup(context) {
		function checkForAwaitExpressions(
			node: AST.AnyNode,
			loopNode:
				| AST.DoStatement
				| AST.ForInStatement
				| AST.ForOfStatement
				| AST.ForStatement
				| AST.WhileStatement,
			sourceFile: AST.SourceFile,
		): void {
			if (node.kind === SyntaxKind.AwaitExpression) {
				const start = node.getStart(sourceFile);
				context.report({
					message: "noAwaitInLoop",
					range: {
						begin: start,
						end: start + "await".length,
					},
				});
				return;
			}

			if (
				node.kind === SyntaxKind.DoStatement ||
				node.kind === SyntaxKind.ForInStatement ||
				node.kind === SyntaxKind.ForOfStatement ||
				node.kind === SyntaxKind.ForStatement ||
				node.kind === SyntaxKind.WhileStatement ||
				tsutils.isFunctionScopeBoundary(node)
			) {
				return;
			}

			forEachChild(node, (child) => {
				checkForAwaitExpressions(child, loopNode, sourceFile);
			});
		}

		function checkNode(
			node:
				| AST.DoStatement
				| AST.ForInStatement
				| AST.ForOfStatement
				| AST.ForStatement
				| AST.WhileStatement,
			{ sourceFile }: TypeScriptFileServices,
		) {
			checkForAwaitExpressions(node.statement, node, sourceFile);
		}

		return {
			visitors: {
				DoStatement: checkNode,
				ForInStatement: checkNode,
				ForOfStatement: checkNode,
				ForStatement: checkNode,
				WhileStatement: checkNode,
			},
		};
	},
});
