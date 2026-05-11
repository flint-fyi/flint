import {
	type AST,
	forEachChild,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as tsutils from "ts-api-utils";
import ts, { SyntaxKind } from "typescript";

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
			if (name.kind === SyntaxKind.Identifier) {
				variables.add(name.text);
			} else if (name.kind === SyntaxKind.ArrayBindingPattern) {
				for (const element of name.elements) {
					if (element.kind === SyntaxKind.BindingElement) {
						addBindingNames(element.name, variables);
					}
				}
			} else {
				for (const element of name.elements) {
					addBindingNames(element.name, variables);
				}
			}
		}

		function referencesLoopVariable(
			node: AST.AnyNode,
			loopVariables: Set<string>,
		): boolean | undefined {
			if (node.kind === SyntaxKind.Identifier && loopVariables.has(node.text)) {
				return true;
			}

			return forEachChild(node, (child) => {
				return (
					child.kind !== SyntaxKind.ArrowFunction &&
					child.kind !== SyntaxKind.CallSignature &&
					child.kind !== SyntaxKind.ClassDeclaration &&
					child.kind !== SyntaxKind.ClassExpression &&
					child.kind !== SyntaxKind.Constructor &&
					child.kind !== SyntaxKind.ConstructorType &&
					child.kind !== SyntaxKind.ConstructSignature &&
					child.kind !== SyntaxKind.EnumDeclaration &&
					child.kind !== SyntaxKind.FunctionDeclaration &&
					child.kind !== SyntaxKind.FunctionExpression &&
					child.kind !== SyntaxKind.FunctionType &&
					child.kind !== SyntaxKind.GetAccessor &&
					child.kind !== SyntaxKind.MethodDeclaration &&
					child.kind !== SyntaxKind.MethodSignature &&
					child.kind !== SyntaxKind.ModuleDeclaration &&
					child.kind !== SyntaxKind.SetAccessor &&
					(child.kind !== SyntaxKind.SourceFile ||
						!ts.isExternalModule(child)) &&
					child.kind !== SyntaxKind.DoStatement &&
					child.kind !== SyntaxKind.ForInStatement &&
					child.kind !== SyntaxKind.ForOfStatement &&
					child.kind !== SyntaxKind.ForStatement &&
					child.kind !== SyntaxKind.WhileStatement &&
					referencesLoopVariable(child, loopVariables)
				);
			});
		}

		function checkFunctionInLoop(
			node: AST.AnyNode,
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
						node.kind === SyntaxKind.FunctionDeclaration ||
						node.kind === SyntaxKind.FunctionExpression
					) {
						keyword = "function";
					} else if (node.kind === SyntaxKind.ArrowFunction) {
						const firstToken = node.getFirstToken(sourceFile);
						if (firstToken?.kind === SyntaxKind.Identifier) {
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
				node.kind === SyntaxKind.DoStatement ||
				node.kind === SyntaxKind.ForInStatement ||
				node.kind === SyntaxKind.ForOfStatement ||
				node.kind === SyntaxKind.ForStatement ||
				node.kind === SyntaxKind.WhileStatement
			) {
				return;
			}

			forEachChild(node, (child) => {
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
