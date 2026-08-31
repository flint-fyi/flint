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
		description:
			"Reports spread operations that accumulate values in loops, causing quadratic time complexity.",
		id: "spreadAccumulators",
		presets: ["logical"],
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
		function getIdentifierName(node: AST.AnyNode): string | undefined {
			return node.kind === SyntaxKind.Identifier ? node.text : undefined;
		}

		function hasSpreadOfIdentifier(
			node: AST.AnyNode,
			identifierName: string,
		): boolean | undefined {
			if (
				(node.kind === SyntaxKind.SpreadElement ||
					node.kind === SyntaxKind.SpreadAssignment) &&
				identifierName === getIdentifierName(node.expression)
			) {
				return true;
			}

			return forEachChild(node, (child) => {
				return hasSpreadOfIdentifier(child, identifierName);
			});
		}

		function checkAssignmentInLoop(
			node: AST.AnyNode,
			sourceFile: AST.SourceFile,
		): void {
			if (
				node.kind === SyntaxKind.BinaryExpression &&
				node.operatorToken.kind === SyntaxKind.EqualsToken
			) {
				checkBinaryEqualsExpression(node, sourceFile);
			}

			forEachChild(node, (child) => {
				if (
					child.kind === SyntaxKind.DoStatement ||
					child.kind === SyntaxKind.ForInStatement ||
					child.kind === SyntaxKind.ForOfStatement ||
					child.kind === SyntaxKind.ForStatement ||
					child.kind === SyntaxKind.WhileStatement ||
					isFunctionScopeBoundary(child)
				) {
					return;
				}
				checkAssignmentInLoop(child, sourceFile);
			});
		}

		function checkBinaryEqualsExpression(
			node: AST.BinaryExpression,
			sourceFile: AST.SourceFile,
		): void {
			const leftName = getIdentifierName(node.left);
			if (!leftName || !hasSpreadOfIdentifier(node.right, leftName)) {
				return;
			}

			const spreadNode = findSpreadElement(node.right, leftName);
			if (!spreadNode) {
				return;
			}

			const start = spreadNode.getStart(sourceFile);
			context.report({
				message: "noAccumulatingSpread",
				range: {
					begin: start,
					end: start + "...".length,
				},
			});
		}

		function findSpreadElement(
			node: AST.AnyNode,
			identifierName: string,
		): AST.AnyNode | undefined {
			if (
				node.kind === SyntaxKind.SpreadElement ||
				node.kind === SyntaxKind.SpreadAssignment
			) {
				const spreadName = getIdentifierName(node.expression);
				if (spreadName === identifierName) {
					return node;
				}
			}

			let result: AST.AnyNode | undefined = undefined;
			forEachChild(node, (child) => {
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
		): void {
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
