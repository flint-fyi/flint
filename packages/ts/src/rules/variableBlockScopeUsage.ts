import ts from "typescript";

import {
	typescriptLanguage,
	type Checker,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports variables declared with var that are referenced outside their defining block scope.",
		id: "variableBlockScopeUsage",
		presets: ["javascript"],
	},
	messages: {
		outOfScope: {
			primary:
				"Variable '{{ name }}' is declared with var but used outside its block scope.",
			secondary: [
				"Variables declared with var are function-scoped, not block-scoped, which can lead to unexpected behavior.",
				"When a var is declared in a block (like an if statement or for loop), it's actually hoisted to the function scope.",
				"References outside the declaring block can access variables that may not be initialized or may have unexpected values.",
			],
			suggestions: [
				"Use let or const instead of var to ensure block-level scoping.",
				"Move the variable declaration to a scope that encompasses all its usages.",
			],
		},
	},
	setup(context) {
		function getDeclaringScope(node: ts.Node): ts.Node | undefined {
			let current = node.parent;
			while (!ts.isSourceFile(current)) {
				if (
					ts.isBlock(current) ||
					ts.isForInStatement(current) ||
					ts.isForOfStatement(current) ||
					ts.isForStatement(current) ||
					ts.isSwitchStatement(current)
				) {
					return current;
				}
				current = current.parent;
			}
			return undefined;
		}

		function isInScope(scope: ts.Node, reference: ts.Node): boolean {
			let current: ts.Node = reference;
			while (!ts.isSourceFile(current)) {
				if (current === scope) {
					return true;
				}
				current = current.parent;
			}
			return false;
		}

		function getSearchRoot(node: ts.Node): ts.Node {
			let current: ts.Node = node;
			while (!ts.isSourceFile(current)) {
				const parent = current.parent;
				if (ts.isFunctionLike(parent) || ts.isSourceFile(parent)) {
					return parent;
				}
				current = parent;
			}
			return current;
		}

		function collectReferences(
			root: ts.Node,
			symbol: ts.Symbol,
			declarationName: ts.Identifier,
			typeChecker: Checker,
		): ts.Identifier[] {
			const references: ts.Identifier[] = [];

			function visit(node: ts.Node): void {
				if (
					ts.isIdentifier(node) &&
					node !== declarationName &&
					typeChecker.getSymbolAtLocation(node) === symbol
				) {
					references.push(node);
				}
				ts.forEachChild(node, visit);
			}

			visit(root);

			return references;
		}

		return {
			visitors: {
				VariableDeclarationList: (node, { sourceFile, typeChecker }) => {
					if (node.flags & ts.NodeFlags.BlockScoped) {
						return;
					}

					for (const declaration of node.declarations) {
						if (!ts.isIdentifier(declaration.name)) {
							continue;
						}

						const declaringScope = getDeclaringScope(declaration.name);
						if (!declaringScope) {
							continue;
						}

						const symbol = typeChecker.getSymbolAtLocation(declaration.name);
						if (!symbol) {
							continue;
						}

						const references = collectReferences(
							getSearchRoot(declaration),
							symbol,
							declaration.name,
							typeChecker,
						);

						for (const reference of references) {
							if (!isInScope(declaringScope, reference)) {
								context.report({
									data: {
										name: declaration.name.text,
									},
									message: "outOfScope",
									range: {
										begin: reference.getStart(sourceFile),
										end: reference.getEnd(),
									},
								});
							}
						}
					}
				},
			},
		};
	},
});
