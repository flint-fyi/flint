import * as ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import type { AST } from "../index.ts";
import { typescriptLanguage } from "../language.ts";

export default typescriptLanguage.createRule({
	about: {
		description: "Disallow using code marked as @deprecated.",
		id: "deprecated",
		preset: "logical",
	},
	messages: {
		deprecated: {
			primary: "This is deprecated.",
			secondary: [
				"The @deprecated JSDoc tag indicates this code should no longer be used.",
				"Deprecated code may be removed in future versions.",
			],
			suggestions: ["Find a non-deprecated alternative."],
		},
	},
	setup(context) {
		function getJsDocDeprecation(
			symbol: ts.Signature | ts.Symbol | undefined,
			typeChecker: ts.TypeChecker,
		) {
			if (!symbol) {
				return false;
			}

			let jsDocTags: ts.JSDocTagInfo[] | undefined;
			try {
				jsDocTags = symbol.getJsDocTags(typeChecker);
			} catch {
				return false;
			}

			return jsDocTags.some((tag) => tag.name === "deprecated");
		}

		function isDeprecatedFromDeclarations(symbol: ts.Symbol | undefined) {
			return symbol?.getDeclarations()?.some((declaration) => {
				const tags = ts.getJSDocTags(declaration);
				return tags.some(
					(tag) =>
						tag.tagName.text === "deprecated" ||
						tag.tagName.text === "Deprecated",
				);
			});
		}

		function searchForDeprecationInAliasesChain(
			symbol: ts.Symbol | undefined,
			typeChecker: ts.TypeChecker,
			checkAliasedSymbol: boolean,
		) {
			if (!symbol) {
				return false;
			}

			if (!(symbol.flags & ts.SymbolFlags.Alias)) {
				return !!(
					checkAliasedSymbol &&
					(getJsDocDeprecation(symbol, typeChecker) ||
						isDeprecatedFromDeclarations(symbol))
				);
			}

			const targetSymbol = typeChecker.getAliasedSymbol(symbol);
			let current: ts.Symbol | undefined = symbol;

			while (current.flags & ts.SymbolFlags.Alias) {
				if (
					getJsDocDeprecation(current, typeChecker) ||
					isDeprecatedFromDeclarations(current)
				) {
					return true;
				}

				if (!current.getDeclarations()) {
					break;
				}

				const immediateAliased = typeChecker.getImmediateAliasedSymbol(current);
				if (!immediateAliased) {
					break;
				}

				current = immediateAliased;

				if (checkAliasedSymbol && current === targetSymbol) {
					return !!(
						getJsDocDeprecation(current, typeChecker) ||
						isDeprecatedFromDeclarations(current)
					);
				}
			}

			return false;
		}

		function isDeprecated(
			symbol: ts.Symbol | undefined,
			typeChecker: ts.TypeChecker,
		) {
			return searchForDeprecationInAliasesChain(symbol, typeChecker, true);
		}

		function isDeclarationSite(node: AST.AnyNode) {
			switch (node.parent.kind) {
				case ts.SyntaxKind.ArrowFunction:
				case ts.SyntaxKind.ClassDeclaration:
				case ts.SyntaxKind.Constructor:
				case ts.SyntaxKind.EnumDeclaration:
				case ts.SyntaxKind.EnumMember:
				case ts.SyntaxKind.FunctionDeclaration:
				case ts.SyntaxKind.FunctionExpression:
				case ts.SyntaxKind.GetAccessor:
				case ts.SyntaxKind.InterfaceDeclaration:
				case ts.SyntaxKind.MethodDeclaration:
				case ts.SyntaxKind.MethodSignature:
				case ts.SyntaxKind.ModuleDeclaration:
				case ts.SyntaxKind.Parameter:
				case ts.SyntaxKind.PropertyDeclaration:
				case ts.SyntaxKind.PropertySignature:
				case ts.SyntaxKind.SetAccessor:
				case ts.SyntaxKind.TypeAliasDeclaration:
				case ts.SyntaxKind.TypeParameter:
				case ts.SyntaxKind.VariableDeclaration:
					return node.parent.name === node;

				case ts.SyntaxKind.ExportSpecifier:
					return node.parent.propertyName === node;

				case ts.SyntaxKind.ImportClause:
				case ts.SyntaxKind.ImportSpecifier:
				case ts.SyntaxKind.NamespaceImport:
					return true;

				case ts.SyntaxKind.PropertyAssignment: {
					return (
						node.parent.name === node &&
						!ts.isComputedPropertyName(node.parent.name) &&
						ts.isObjectLiteralExpression(node.parent.parent)
					);
				}
			}
		}

		function getCallLikeExpression(node: AST.AnyNode) {
			let current: AST.AnyNode = node;

			while (
				ts.isPropertyAccessExpression(current.parent) &&
				current.parent.name === current
			) {
				current = current.parent;
			}

			while (
				ts.isElementAccessExpression(current.parent) &&
				current.parent.argumentExpression === current
			) {
				current = current.parent;
			}

			switch (current.parent.kind) {
				case ts.SyntaxKind.CallExpression:
				case ts.SyntaxKind.Decorator:
				case ts.SyntaxKind.NewExpression:
					return current.parent.expression === current && current.parent;

				case ts.SyntaxKind.TaggedTemplateExpression:
					return current.parent.tag === current && current.parent;
			}

			return undefined;
		}

		function getCallLikeDeprecation(
			node: AST.AnyNode,
			callLike:
				| AST.CallExpression
				| AST.Decorator
				| AST.NewExpression
				| AST.TaggedTemplateExpression,
			typeChecker: ts.TypeChecker,
		) {
			const signature = typeChecker.getResolvedSignature(
				// @ts-expect-error -- https://github.com/flint-fyi/flint/issues/1404
				callLike as ts.CallLikeExpression,
			);
			const symbol = typeChecker.getSymbolAtLocation(node);

			const aliasedSymbol =
				symbol && symbol.flags & ts.SymbolFlags.Alias
					? typeChecker.getAliasedSymbol(symbol)
					: symbol;

			const symbolDeclarationKind = aliasedSymbol?.declarations?.[0]?.kind;

			if (
				symbolDeclarationKind !== ts.SyntaxKind.MethodDeclaration &&
				symbolDeclarationKind !== ts.SyntaxKind.FunctionDeclaration &&
				symbolDeclarationKind !== ts.SyntaxKind.MethodSignature
			) {
				return (
					searchForDeprecationInAliasesChain(symbol, typeChecker, true) ||
					getJsDocDeprecation(signature, typeChecker) ||
					isDeprecatedFromDeclarations(aliasedSymbol)
				);
			}

			return (
				searchForDeprecationInAliasesChain(symbol, typeChecker, false) ||
				getJsDocDeprecation(signature, typeChecker)
			);
		}

		function checkNode(
			node: AST.AnyNode,
			sourceFile: ts.SourceFile,
			typeChecker: ts.TypeChecker,
		) {
			if (isDeclarationSite(node) || isInsideImport(node)) {
				return;
			}

			const callLike = getCallLikeExpression(node);
			if (callLike) {
				if (getCallLikeDeprecation(node, callLike, typeChecker)) {
					context.report({
						message: "deprecated",
						range: getTSNodeRange(node, sourceFile),
					});
				}
				return;
			}

			if (
				ts.isShorthandPropertyAssignment(node.parent) &&
				node.parent.name === node
			) {
				const symbol = typeChecker.getSymbolAtLocation(node);
				const valueSymbol =
					symbol &&
					typeChecker.getShorthandAssignmentValueSymbol(
						symbol.valueDeclaration,
					);
				if (
					valueSymbol &&
					(getJsDocDeprecation(valueSymbol, typeChecker) ||
						isDeprecatedFromDeclarations(valueSymbol))
				) {
					context.report({
						message: "deprecated",
						range: getTSNodeRange(node, sourceFile),
					});
				}
				return;
			}

			const symbol = typeChecker.getSymbolAtLocation(node);
			if (isDeprecated(symbol, typeChecker)) {
				context.report({
					message: "deprecated",
					range: getTSNodeRange(node, sourceFile),
				});
			}
		}

		// TODO: Use a util like getStaticValue
		// https://github.com/flint-fyi/flint/issues/1298
		function checkComputedPropertyAccess(
			node: AST.ElementAccessExpression,
			sourceFile: ts.SourceFile,
			typeChecker: ts.TypeChecker,
		) {
			const argumentExpression = node.argumentExpression;
			const argumentType = typeChecker.getTypeAtLocation(argumentExpression);

			if (!argumentType.isLiteral()) {
				return;
			}

			const objectType = typeChecker.getTypeAtLocation(node.expression);
			let propertyName: string;
			if (argumentType.isStringLiteral()) {
				propertyName = argumentType.value;
			} else if (argumentType.isNumberLiteral()) {
				propertyName = String(argumentType.value);
			} else {
				return;
			}

			const property = objectType.getProperty(propertyName);
			if (
				property &&
				(getJsDocDeprecation(property, typeChecker) ||
					isDeprecatedFromDeclarations(property))
			) {
				context.report({
					message: "deprecated",
					range: getTSNodeRange(argumentExpression, sourceFile),
				});
			}
		}

		function checkBindingElement(
			node: AST.BindingElement,
			sourceFile: ts.SourceFile,
			typeChecker: ts.TypeChecker,
		) {
			const bindingPattern = node.parent;
			if (!ts.isObjectBindingPattern(bindingPattern)) {
				return;
			}

			const propertyName = node.propertyName ?? node.name;
			if (!ts.isIdentifier(propertyName)) {
				return;
			}

			const declarationOrPattern = bindingPattern.parent;
			let objectType: ts.Type | undefined;

			if (ts.isVariableDeclaration(declarationOrPattern)) {
				const initializer = declarationOrPattern.initializer;
				if (initializer) {
					objectType = typeChecker.getTypeAtLocation(initializer);
				}
			} else if (ts.isBindingElement(declarationOrPattern)) {
				const parentInitializer = declarationOrPattern.parent.parent;
				if (ts.isVariableDeclaration(parentInitializer)) {
					const init = parentInitializer.initializer;
					if (init) {
						const parentType = typeChecker.getTypeAtLocation(init);
						const parentPropertyName =
							declarationOrPattern.propertyName ?? declarationOrPattern.name;
						if (ts.isIdentifier(parentPropertyName)) {
							const prop = parentType.getProperty(parentPropertyName.text);
							if (prop) {
								objectType = typeChecker.getTypeOfSymbolAtLocation(
									prop,
									parentInitializer,
								);
							}
						}
					}
				}
			}

			if (objectType) {
				const property = objectType.getProperty(propertyName.text);
				if (
					property &&
					(getJsDocDeprecation(property, typeChecker) ||
						isDeprecatedFromDeclarations(property))
				) {
					const reportNode = node.propertyName ?? node.name;
					if (ts.isIdentifier(reportNode)) {
						context.report({
							message: "deprecated",
							range: getTSNodeRange(reportNode, sourceFile),
						});
					}
				}
			}
		}

		function checkHeritageClause(
			node: AST.HeritageClause,
			sourceFile: ts.SourceFile,
			typeChecker: ts.TypeChecker,
		) {
			for (const type of node.types) {
				if (ts.isIdentifier(type.expression)) {
					const symbol = typeChecker.getSymbolAtLocation(type.expression);
					if (isDeprecated(symbol, typeChecker)) {
						context.report({
							message: "deprecated",
							range: getTSNodeRange(type.expression, sourceFile),
						});
					}
				}
			}
		}

		function checkSuperCall(
			node: AST.SuperExpression,
			sourceFile: ts.SourceFile,
			typeChecker: ts.TypeChecker,
		) {
			const callExpr = node.parent;
			if (!ts.isCallExpression(callExpr) || callExpr.expression !== node) {
				return;
			}

			const signature = typeChecker.getResolvedSignature(callExpr);
			if (signature && getJsDocDeprecation(signature, typeChecker)) {
				context.report({
					message: "deprecated",
					range: getTSNodeRange(node, sourceFile),
				});
			}
		}

		return {
			visitors: {
				BindingElement: (node, { sourceFile, typeChecker }) => {
					checkBindingElement(node, sourceFile, typeChecker);
				},

				ElementAccessExpression: (node, { sourceFile, typeChecker }) => {
					checkComputedPropertyAccess(node, sourceFile, typeChecker);
				},

				HeritageClause: (node, { sourceFile, typeChecker }) => {
					checkHeritageClause(node, sourceFile, typeChecker);
				},

				Identifier: (node, { sourceFile, typeChecker }) => {
					if (isInsideHeritageClause(node)) {
						return;
					}

					if (
						ts.isPropertyAccessExpression(node.parent) &&
						node === node.parent.name
					) {
						checkNode(node, sourceFile, typeChecker);
						return;
					}

					if (ts.isQualifiedName(node.parent) && node === node.parent.right) {
						checkNode(node, sourceFile, typeChecker);
						return;
					}

					if (
						ts.isElementAccessExpression(node.parent) &&
						node === node.parent.argumentExpression
					) {
						return;
					}

					checkNode(node, sourceFile, typeChecker);
				},

				PrivateIdentifier: (node, { sourceFile, typeChecker }) => {
					if (
						ts.isPropertyAccessExpression(node.parent) &&
						node === node.parent.name
					) {
						checkNode(node, sourceFile, typeChecker);
					}
				},

				SuperKeyword: (node, { sourceFile, typeChecker }) => {
					checkSuperCall(node, sourceFile, typeChecker);
				},
			},
		};
	},
});

// TODO (#400): Switch to scope analysis
function isInsideHeritageClause(node: AST.AnyNode) {
	if (ts.isHeritageClause(node)) {
		return true;
	}

	let current: ts.Node | undefined = node.parent;

	while (current) {
		if (ts.isHeritageClause(current)) {
			return true;
		}

		if (ts.isSourceFile(current) || ts.isClassDeclaration(current)) {
			break;
		}

		current = current.parent as ts.Node | undefined;
	}

	return false;
}

// TODO (#400): Switch to scope analysis
function isInsideImport(node: AST.AnyNode) {
	if (ts.isImportDeclaration(node)) {
		return true;
	}

	let current: ts.Node | undefined = node.parent;

	while (current) {
		if (ts.isImportDeclaration(current)) {
			return true;
		}

		if (
			ts.isSourceFile(current) ||
			ts.isFunctionDeclaration(current) ||
			ts.isFunctionExpression(current) ||
			ts.isArrowFunction(current) ||
			ts.isClassDeclaration(current) ||
			ts.isClassExpression(current) ||
			ts.isBlock(current)
		) {
			return false;
		}

		current = current.parent as ts.Node | undefined;
	}

	return false;
}
