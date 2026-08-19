import type ts from "typescript";

import {
	typescriptLanguage,
	type AST,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";
import tsutils from "@flint.fyi/typescript-language/ts-api-utils";
import typescript, {
	SyntaxKind,
} from "@flint.fyi/typescript-language/typescript";

import { ruleCreator } from "../ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports function declarations and expressions inside loops that reference variables modified by the loop.",
		id: "loopFunctions",
		presets: ["logical"],
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
			switch (name.kind) {
				case SyntaxKind.ArrayBindingPattern: {
					for (const element of name.elements) {
						if (element.kind === SyntaxKind.BindingElement) {
							addBindingNames(element.name, variables);
						}
					}

					break;
				}
				case SyntaxKind.Identifier: {
					variables.add(name.text);

					break;
				}
				case SyntaxKind.ObjectBindingPattern: {
					for (const element of name.elements) {
						addBindingNames(element.name, variables);
					}

					break;
				}
			}
		}

		function referencesLoopVariable(
			node: ts.Node,
			loopVariables: Set<string>,
		): boolean | undefined {
			if (typescript.isIdentifier(node) && loopVariables.has(node.text)) {
				return true;
			}

			return typescript.forEachChild(node, (child) => {
				return (
					!tsutils.isFunctionScopeBoundary(child) &&
					!typescript.isDoStatement(child) &&
					!typescript.isForInStatement(child) &&
					!typescript.isForOfStatement(child) &&
					!typescript.isForStatement(child) &&
					!typescript.isWhileStatement(child) &&
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
			sourceFile: AST.SourceFile,
		): void {
			if (tsutils.isFunctionScopeBoundary(node)) {
				if (referencesLoopVariable(node, loopVariables)) {
					const start = node.getStart(sourceFile);
					let keyword = "function";

					if (
						typescript.isFunctionDeclaration(node) ||
						typescript.isFunctionExpression(node)
					) {
						keyword = "function";
					} else if (typescript.isArrowFunction(node)) {
						const firstToken = node.getFirstToken(sourceFile);
						if (firstToken && typescript.isIdentifier(firstToken)) {
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
				typescript.isDoStatement(node) ||
				typescript.isForInStatement(node) ||
				typescript.isForOfStatement(node) ||
				typescript.isForStatement(node) ||
				typescript.isWhileStatement(node)
			) {
				return;
			}

			typescript.forEachChild(node, (child) => {
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
			if (loopVariables.size) {
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
