import * as tsutils from "ts-api-utils";
import ts, { SyntaxKind } from "typescript";

import {
	typescriptLanguage,
	type AST,
	type Checker,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Move function definitions to the highest possible scope.",
		id: "functionDefinitionScopeConsistency",
		presets: ["stylisticStrict"],
	},
	messages: {
		moveToOuterScope: {
			primary:
				"Function does not capture any variables from the enclosing scope and can be moved to the outer scope.",
			secondary: [
				"Functions that don't use variables from their enclosing scope can be defined at a higher level.",
				"This improves readability and allows JavaScript engines to better optimize performance.",
			],
			suggestions: [
				"Move the function to the outer scope, above its current containing function.",
			],
		},
	},
	setup(context) {
		function collectScopeVariables(scopeNode: ts.Node, typeChecker: Checker) {
			const variables = new Set<ts.Symbol>();

			function collectFromNode(node: ts.Node) {
				if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
					const symbol = typeChecker.getSymbolAtLocation(node.name);
					if (symbol) {
						variables.add(symbol);
					}
				}

				if (ts.isParameter(node) && ts.isIdentifier(node.name)) {
					const symbol = typeChecker.getSymbolAtLocation(node.name);
					if (symbol) {
						variables.add(symbol);
					}
				}

				if (ts.isFunctionDeclaration(node) && node.name) {
					const symbol = typeChecker.getSymbolAtLocation(node.name);
					if (symbol) {
						variables.add(symbol);
					}
				}

				if (tsutils.isFunctionScopeBoundary(node) && node !== scopeNode) {
					return;
				}

				ts.forEachChild(node, collectFromNode);
			}

			collectFromNode(scopeNode);
			return variables;
		}

		function referencesVariable(
			node: ts.Node,
			variables: Set<ts.Symbol>,
			typeChecker: Checker,
			selfSymbol: ts.Symbol | undefined,
		): boolean | undefined {
			if (ts.isIdentifier(node)) {
				const symbol = typeChecker.getSymbolAtLocation(node);
				if (symbol && symbol !== selfSymbol && variables.has(symbol)) {
					return true;
				}
			}

			if (node.kind === SyntaxKind.ThisKeyword) {
				return true;
			}

			return ts.forEachChild(node, (child) =>
				referencesVariable(child, variables, typeChecker, selfSymbol),
			);
		}

		function isNestedFunction(node: ts.Node) {
			for (
				let current = node.parent;
				!ts.isSourceFile(current);
				current = current.parent
			) {
				if (tsutils.isFunctionScopeBoundary(current)) {
					return true;
				}
			}

			return false;
		}

		function getEnclosingFunction(
			node: ts.Node,
		): ts.FunctionLikeDeclaration | undefined {
			for (
				let current = node.parent;
				!ts.isSourceFile(current);
				current = current.parent
			) {
				if (tsutils.isFunctionScopeBoundary(current)) {
					return current as ts.FunctionLikeDeclaration;
				}
			}

			return undefined;
		}

		function checkFunction(
			node:
				| AST.ArrowFunction
				| AST.FunctionDeclaration
				| AST.FunctionExpression,
			sourceFile: AST.SourceFile,
			typeChecker: Checker,
		) {
			if (!isNestedFunction(node)) {
				return;
			}

			const enclosingFunction = getEnclosingFunction(node);
			if (!enclosingFunction) {
				return;
			}

			const enclosingScopeVariables = collectScopeVariables(
				enclosingFunction,
				typeChecker,
			);

			let selfSymbol: ts.Symbol | undefined;
			if (ts.isFunctionDeclaration(node) && node.name) {
				selfSymbol = typeChecker.getSymbolAtLocation(node.name);
			}
			if (ts.isFunctionExpression(node) && node.name) {
				selfSymbol = typeChecker.getSymbolAtLocation(node.name);
			}

			if (
				referencesVariable(
					node,
					enclosingScopeVariables,
					typeChecker,
					selfSymbol,
				)
			) {
				return;
			}

			const functionKeyword =
				node.kind === SyntaxKind.ArrowFunction
					? undefined
					: node
							.getChildren(sourceFile)
							.find((child) => child.kind === SyntaxKind.FunctionKeyword);

			const start = functionKeyword
				? functionKeyword.getStart(sourceFile)
				: node.getStart(sourceFile);
			const end = functionKeyword ? functionKeyword.getEnd() : start + 1;

			context.report({
				message: "moveToOuterScope",
				range: { begin: start, end },
			});
		}

		return {
			visitors: {
				ArrowFunction: (node, { sourceFile, typeChecker }) => {
					checkFunction(node, sourceFile, typeChecker);
				},
				FunctionDeclaration: (node, { sourceFile, typeChecker }) => {
					checkFunction(node, sourceFile, typeChecker);
				},
				FunctionExpression: (node, { sourceFile, typeChecker }) => {
					checkFunction(node, sourceFile, typeChecker);
				},
			},
		};
	},
});
