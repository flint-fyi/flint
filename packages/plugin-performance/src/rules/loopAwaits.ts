import { type TypeScriptFileServices, typescriptLanguage } from "@flint.fyi/ts";
import * as tsutils from "ts-api-utils";
import ts, { SyntaxKind } from "typescript";

export default typescriptLanguage.createRule({
	about: {
		description: "Reports using await expressions inside loops.",
		id: "loopAwaits",
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
			node: ts.Node,
			loopNode: ts.Node,
			sourceFile: ts.SourceFile,
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

			ts.forEachChild(node, (child) => {
				checkForAwaitExpressions(child, loopNode, sourceFile);
			});
		}

		function checkNode(
			node: ts.Node & { statement: ts.Node },
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
