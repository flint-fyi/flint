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
		const loopVariableNames = new Map<AST.AnyNode, Set<string>>();

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
			node: AST.AnyNode,
			loopVariables: Set<string>,
		): boolean | undefined {
			if (node.kind === SyntaxKind.Identifier && loopVariables.has(node.text)) {
				return true;
			}

			return forEachChild(node, (child) => {
				return (
					!isFunctionScopeBoundary(child) &&
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
			if (isFunctionScopeBoundary(node)) {
				if (referencesLoopVariable(node, loopVariables)) {
					const start = node.getStart(sourceFile);
					let keyword = "function";

					if (
						node.kind === SyntaxKind.FunctionDeclaration ||
						node.kind === SyntaxKind.FunctionExpression
					) {
						keyword = "function";
					} else if (node.kind === SyntaxKind.ArrowFunction) {
						const firstParameter = node.parameters[0];
						if (
							firstParameter?.name.kind === SyntaxKind.Identifier &&
							firstParameter.name.getStart(sourceFile) === start
						) {
							keyword = firstParameter.name.text;
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
