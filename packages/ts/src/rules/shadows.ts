import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

interface Scope {
	names: Set<string>;
	node: ts.Node;
}

function isFunctionExpressionNameMatchingVariable(
	node: AST.ClassExpression | AST.FunctionExpression,
) {
	if (!node.name) {
		return false;
	}

	const parent = node.parent;
	if (!ts.isVariableDeclaration(parent)) {
		return false;
	}

	if (!ts.isIdentifier(parent.name)) {
		return false;
	}

	return parent.name.text === node.name.text;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports variables that shadow variables in outer scopes.",
		id: "shadows",
		presets: ["logical"],
	},
	messages: {
		shadow: {
			primary: "Variable '{{ name }}' shadows a variable in an outer scope.",
			secondary: [
				"Shadowing can lead to confusion about which variable is being referenced.",
				"This may cause bugs if the wrong variable is accidentally accessed.",
			],
			suggestions: ["Rename the variable to avoid shadowing."],
		},
	},
	setup(context) {
		const scopeStack: Scope[] = [];

		function isShadowing(name: string): boolean {
			for (let index = scopeStack.length - 2; index >= 0; index--) {
				if (scopeStack[index].names.has(name)) {
					return true;
				}
			}
			return false;
		}

		function pushScope(node: ts.Node): void {
			scopeStack.push({ names: new Set(), node });
		}

		function popScope(): void {
			scopeStack.pop();
		}

		function getCurrentScope(): Scope | undefined {
			return scopeStack[scopeStack.length - 1];
		}

		function addToCurrentScope(name: string): void {
			const scope = getCurrentScope();
			if (scope) {
				scope.names.add(name);
			}
		}

		function checkAndReportShadow(
			name: string,
			node: ts.Node,
			sourceFile: AST.SourceFile,
		): void {
			if (isShadowing(name)) {
				context.report({
					data: { name },
					message: "shadow",
					range: getTSNodeRange(node, sourceFile),
				});
			}
			addToCurrentScope(name);
		}

		function checkBindingName(
			bindingName: AST.BindingName,
			sourceFile: AST.SourceFile,
		): void {
			if (ts.isIdentifier(bindingName)) {
				checkAndReportShadow(bindingName.text, bindingName, sourceFile);
			} else if (ts.isObjectBindingPattern(bindingName)) {
				for (const element of bindingName.elements) {
					checkBindingName(element.name, sourceFile);
				}
			} else if (ts.isArrayBindingPattern(bindingName)) {
				for (const element of bindingName.elements) {
					if (!ts.isOmittedExpression(element)) {
						checkBindingName(element.name, sourceFile);
					}
				}
			}
		}

		function checkParameters(
			parameters: ts.NodeArray<AST.ParameterDeclaration>,
			sourceFile: AST.SourceFile,
		): void {
			for (const parameter of parameters) {
				checkBindingName(parameter.name, sourceFile);
			}
		}

		function visitNode(node: ts.Node, sourceFile: AST.SourceFile): void {
			switch (node.kind) {
				case ts.SyntaxKind.ArrowFunction: {
					const arrowNode = node as AST.ArrowFunction;
					pushScope(node);
					checkParameters(arrowNode.parameters, sourceFile);
					if (ts.isBlock(arrowNode.body)) {
						ts.forEachChild(arrowNode.body, (child) => {
							visitNode(child, sourceFile);
						});
					} else {
						visitNode(arrowNode.body, sourceFile);
					}
					popScope();
					return;
				}

				case ts.SyntaxKind.Block: {
					pushScope(node);
					ts.forEachChild(node, (child) => {
						visitNode(child, sourceFile);
					});
					popScope();
					return;
				}

				case ts.SyntaxKind.CatchClause: {
					const catchNode = node as AST.CatchClause;
					pushScope(node);
					if (catchNode.variableDeclaration) {
						checkBindingName(catchNode.variableDeclaration.name, sourceFile);
					}
					ts.forEachChild(catchNode.block, (child) => {
						visitNode(child, sourceFile);
					});
					popScope();
					return;
				}

				case ts.SyntaxKind.ClassDeclaration: {
					const classNode = node as AST.ClassDeclaration;
					if (classNode.name) {
						checkAndReportShadow(
							classNode.name.text,
							classNode.name,
							sourceFile,
						);
					}
					pushScope(node);
					ts.forEachChild(node, (child) => {
						visitNode(child, sourceFile);
					});
					popScope();
					return;
				}

				case ts.SyntaxKind.ClassExpression: {
					const classNode = node as AST.ClassExpression;
					pushScope(node);
					if (
						classNode.name &&
						!isFunctionExpressionNameMatchingVariable(classNode)
					) {
						checkAndReportShadow(
							classNode.name.text,
							classNode.name,
							sourceFile,
						);
					} else if (classNode.name) {
						addToCurrentScope(classNode.name.text);
					}
					ts.forEachChild(node, (child) => {
						visitNode(child, sourceFile);
					});
					popScope();
					return;
				}

				case ts.SyntaxKind.Constructor:
				case ts.SyntaxKind.GetAccessor:
				case ts.SyntaxKind.MethodDeclaration:
				case ts.SyntaxKind.SetAccessor: {
					const methodNode = node as
						| AST.ConstructorDeclaration
						| AST.GetAccessorDeclaration
						| AST.MethodDeclaration
						| AST.SetAccessorDeclaration;
					pushScope(node);
					checkParameters(methodNode.parameters, sourceFile);
					if (methodNode.body) {
						visitNode(methodNode.body, sourceFile);
					}
					popScope();
					return;
				}
				case ts.SyntaxKind.ForInStatement:
				case ts.SyntaxKind.ForOfStatement:
				case ts.SyntaxKind.ForStatement: {
					pushScope(node);
					ts.forEachChild(node, (child) => {
						visitNode(child, sourceFile);
					});
					popScope();
					return;
				}
				case ts.SyntaxKind.FunctionDeclaration: {
					const functionNode = node as AST.FunctionDeclaration;
					if (functionNode.name) {
						checkAndReportShadow(
							functionNode.name.text,
							functionNode.name,
							sourceFile,
						);
					}
					pushScope(node);
					checkParameters(functionNode.parameters, sourceFile);
					if (functionNode.body) {
						visitNode(functionNode.body, sourceFile);
					}
					popScope();
					return;
				}
				case ts.SyntaxKind.FunctionExpression: {
					const functionNode = node as AST.FunctionExpression;
					pushScope(node);
					if (
						functionNode.name &&
						!isFunctionExpressionNameMatchingVariable(functionNode)
					) {
						checkAndReportShadow(
							functionNode.name.text,
							functionNode.name,
							sourceFile,
						);
					} else if (functionNode.name) {
						addToCurrentScope(functionNode.name.text);
					}
					checkParameters(functionNode.parameters, sourceFile);
					visitNode(functionNode.body, sourceFile);
					popScope();
					return;
				}

				case ts.SyntaxKind.SourceFile:
					pushScope(node);
					ts.forEachChild(node, (child) => {
						visitNode(child, sourceFile);
					});
					popScope();
					return;

				case ts.SyntaxKind.VariableDeclaration: {
					const varNode = node as AST.VariableDeclaration;
					checkBindingName(varNode.name, sourceFile);
					if (varNode.initializer) {
						visitNode(varNode.initializer, sourceFile);
					}
					return;
				}

				default:
					ts.forEachChild(node, (child) => {
						visitNode(child, sourceFile);
					});
			}
		}

		return {
			visitors: {
				SourceFile: (sourceFile) => {
					scopeStack.length = 0;
					visitNode(sourceFile, sourceFile);
				},
			},
		};
	},
});
