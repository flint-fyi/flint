import { SyntaxKind } from "typescript-native/unstable/ast";

import {
	forEachChild,
	typescriptLanguage,
	type AST,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

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
				isFunctionScopeBoundary(node)
			) {
				return;
			}

			forEachChild(node, (child) => {
				checkForAwaitExpressions(child, sourceFile);
			});
		}

		function checkNode(
			node: AST.IterationStatement,
			{ sourceFile }: TypeScriptFileServices,
		): void {
			checkForAwaitExpressions(node.statement, sourceFile);
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

function isFunctionScopeBoundary(node: AST.AnyNode): boolean {
	switch (node.kind) {
		case SyntaxKind.ArrowFunction:
		case SyntaxKind.CallSignature:
		case SyntaxKind.ClassDeclaration:
		case SyntaxKind.ClassExpression:
		case SyntaxKind.Constructor:
		case SyntaxKind.ConstructorType:
		case SyntaxKind.ConstructSignature:
		case SyntaxKind.EnumDeclaration:
		case SyntaxKind.FunctionDeclaration:
		case SyntaxKind.FunctionExpression:
		case SyntaxKind.FunctionType:
		case SyntaxKind.GetAccessor:
		case SyntaxKind.MethodDeclaration:
		case SyntaxKind.MethodSignature:
		case SyntaxKind.ModuleDeclaration:
		case SyntaxKind.SetAccessor:
			return true;
		case SyntaxKind.SourceFile:
			return !!node.externalModuleIndicator;
		default:
			return false;
	}
}
