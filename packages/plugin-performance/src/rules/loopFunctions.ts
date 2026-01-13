import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/ts";
import * as tsutils from "ts-api-utils";
import ts, { SyntaxKind } from "typescript";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports function declarations and expressions inside loops that reference variables modified by the loop.",
		id: "loopFunctions",
	},
	messages: {
		noFunctionInLoop: {
			primary:
				"Functions created inside loops can cause unexpected behavior when referencing variables modified by the loop.",
			secondary: [
				"Functions created in loops share the same scope, capturing the final value of loop variables rather than their value at creation time.",
				"This often leads to bugs where all created functions reference the same variable value.",
			],
			suggestions: [
				"Move the function outside the loop if possible.",
				"Use IIFE (Immediately Invoked Function Expression) to create a new scope.",
				"Use `let` or `const` for loop variables to create block-scoped bindings.",
			],
		},
	},
	setup(context) {
		const loopVariableNames = new Map<ts.Node, Set<string>>();

		function getLoopVariables(
			loopNode:
				| AST.DoStatement
				| AST.ForInStatement
				| AST.ForOfStatement
				| AST.ForStatement
				| AST.WhileStatement,
		) {
			const existing = loopVariableNames.get(loopNode);
			if (existing) {
				return existing;
			}

			const variables = new Set<string>();

			if (loopNode.kind === SyntaxKind.ForStatement) {
				if (loopNode.initializer) {
					collectVariableNames(loopNode.initializer, variables);
				}
			} else if (
				loopNode.kind === SyntaxKind.ForInStatement ||
				loopNode.kind === SyntaxKind.ForOfStatement
			) {
				collectVariableNames(loopNode.initializer, variables);
			}

			loopVariableNames.set(loopNode, variables);
			return variables;
		}

		function collectVariableNames(
			node: AST.ForInitializer,
			variables: Set<string>,
		) {
			if (node.kind === SyntaxKind.VariableDeclarationList) {
				for (const declaration of node.declarations) {
					addBindingNames(declaration.name, variables);
				}
			} else if (node.kind === SyntaxKind.Identifier) {
				variables.add(node.text);
			}
		}

		function addBindingNames(
			name: AST.BindingName,
			variables: Set<string>,
		): void {
			if (ts.isIdentifier(name)) {
				variables.add(name.text);
			} else if (ts.isArrayBindingPattern(name)) {
				for (const element of name.elements) {
					if (ts.isBindingElement(element)) {
						addBindingNames(element.name, variables);
					}
				}
			} else if (ts.isObjectBindingPattern(name)) {
				for (const element of name.elements) {
					addBindingNames(element.name, variables);
				}
			}
		}

		function referencesLoopVariable(
			node: ts.Node,
			loopVariables: Set<string>,
		): boolean | undefined {
			if (ts.isIdentifier(node) && loopVariables.has(node.text)) {
				return true;
			}

			return ts.forEachChild(node, (child) => {
				return (
					!tsutils.isFunctionScopeBoundary(child) &&
					!ts.isDoStatement(child) &&
					!ts.isForInStatement(child) &&
					!ts.isForOfStatement(child) &&
					!ts.isForStatement(child) &&
					!ts.isWhileStatement(child) &&
					referencesLoopVariable(child, loopVariables)
				);
			});
		}

		function checkFunctionInLoop(
			node: ts.Node,
			loopNode:
				| AST.DoStatement
				| AST.ForInStatement
				| AST.ForOfStatement
				| AST.ForStatement
				| AST.WhileStatement,
			loopVariables: Set<string>,
			sourceFile: ts.SourceFile,
		): void {
			if (tsutils.isFunctionScopeBoundary(node)) {
				if (referencesLoopVariable(node, loopVariables)) {
					const start = node.getStart(sourceFile);
					let keyword = "function";

					if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) {
						keyword = "function";
					} else if (ts.isArrowFunction(node)) {
						const firstToken = node.getFirstToken(sourceFile);
						if (firstToken && ts.isIdentifier(firstToken)) {
							keyword = firstToken.text;
						} else {
							keyword = "(";
						}
					}

					context.report({
						message: "noFunctionInLoop",
						range: {
							begin: start,
							end: start + keyword.length,
						},
					});
				}
				return;
			}

			if (
				ts.isDoStatement(node) ||
				ts.isForInStatement(node) ||
				ts.isForOfStatement(node) ||
				ts.isForStatement(node) ||
				ts.isWhileStatement(node)
			) {
				return;
			}

			ts.forEachChild(node, (child) => {
				checkFunctionInLoop(child, loopNode, loopVariables, sourceFile);
			});
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
			const loopVariables = getLoopVariables(node);
			if (loopVariables.size > 0) {
				checkFunctionInLoop(node.statement, node, loopVariables, sourceFile);
			}
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
