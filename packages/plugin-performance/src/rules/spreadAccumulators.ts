import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/ts";
import * as tsutils from "ts-api-utils";
import ts from "typescript";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports spread operations that accumulate values in loops, causing quadratic time complexity.",
		id: "spreadAccumulators",
	},
	messages: {
		noAccumulatingSpread: {
			primary:
				"Using spread operations to accumulate values in loops causes quadratic time complexity.",
			secondary: [
				"Each iteration creates a new array or object by copying all previous elements, resulting in O(n²) time complexity.",
				"This can significantly slow down your code as the accumulated collection grows.",
			],
			suggestions: [
				"For arrays, use `.push()` method instead of spreading.",
				"For objects, use direct property assignment or `Object.assign()`.",
			],
		},
	},
	setup(context) {
		function getIdentifierName(node: ts.Node) {
			return ts.isIdentifier(node) ? node.text : undefined;
		}

		function hasSpreadOfIdentifier(
			node: ts.Node,
			identifierName: string,
		): boolean | undefined {
			if (ts.isSpreadElement(node) || ts.isSpreadAssignment(node)) {
				if (identifierName === getIdentifierName(node.expression)) {
					return true;
				}
			}

			return ts.forEachChild(node, (child) => {
				return hasSpreadOfIdentifier(child, identifierName);
			});
		}

		function checkAssignmentInLoop(node: ts.Node, sourceFile: ts.SourceFile) {
			if (
				ts.isBinaryExpression(node) &&
				node.operatorToken.kind === ts.SyntaxKind.EqualsToken
			) {
				checkBinaryEqualsExpression(node, sourceFile);
			}

			ts.forEachChild(node, (child) => {
				if (
					ts.isDoStatement(child) ||
					ts.isForInStatement(child) ||
					ts.isForOfStatement(child) ||
					ts.isForStatement(child) ||
					ts.isWhileStatement(child) ||
					tsutils.isFunctionScopeBoundary(child)
				) {
					return;
				}
				checkAssignmentInLoop(child, sourceFile);
			});
		}

		function checkBinaryEqualsExpression(
			node: ts.BinaryExpression,
			sourceFile: ts.SourceFile,
		) {
			const leftName = getIdentifierName(node.left);
			if (!leftName || !hasSpreadOfIdentifier(node.right, leftName)) {
				return;
			}

			const spreadNode = findSpreadElement(node.right, leftName);
			if (!spreadNode) {
				return;
			}

			const firstToken = spreadNode.getFirstToken(sourceFile);
			if (firstToken?.kind !== ts.SyntaxKind.DotDotDotToken) {
				return;
			}

			const start = firstToken.getStart(sourceFile);
			context.report({
				message: "noAccumulatingSpread",
				range: {
					begin: start,
					end: start + "...".length,
				},
			});
		}

		function findSpreadElement(
			node: ts.Node,
			identifierName: string,
		): ts.Node | undefined {
			if (ts.isSpreadElement(node) || ts.isSpreadAssignment(node)) {
				const spreadName = getIdentifierName(node.expression);
				if (spreadName === identifierName) {
					return node;
				}
			}

			let result: ts.Node | undefined = undefined;
			ts.forEachChild(node, (child) => {
				result ??= findSpreadElement(child, identifierName);
			});

			return result;
		}

		function checkLoopStatement(
			node:
				| AST.DoStatement
				| AST.ForInStatement
				| AST.ForOfStatement
				| AST.ForStatement
				| AST.WhileStatement,
			{ sourceFile }: TypeScriptFileServices,
		) {
			checkAssignmentInLoop(node.statement, sourceFile);
		}

		return {
			visitors: {
				DoStatement: checkLoopStatement,
				ForInStatement: checkLoopStatement,
				ForOfStatement: checkLoopStatement,
				ForStatement: checkLoopStatement,
				WhileStatement: checkLoopStatement,
			},
		};
	},
});
