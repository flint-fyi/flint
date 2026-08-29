import ts, { SyntaxKind } from "typescript";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Disallow using code marked as @deprecated.",
		id: "deprecated",
		presets: ["logical", "logicalStrict"],
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
				case SyntaxKind.ArrowFunction:
				case SyntaxKind.ClassDeclaration:
				case SyntaxKind.Constructor:
				case SyntaxKind.EnumDeclaration:
				case SyntaxKind.EnumMember:
				case SyntaxKind.FunctionDeclaration:
				case SyntaxKind.FunctionExpression:
				case SyntaxKind.GetAccessor:
				case SyntaxKind.InterfaceDeclaration:
				case SyntaxKind.MethodDeclaration:
				case SyntaxKind.MethodSignature:
				case SyntaxKind.ModuleDeclaration:
				case SyntaxKind.Parameter:
				case SyntaxKind.PropertyDeclaration:
				case SyntaxKind.PropertySignature:
				case SyntaxKind.SetAccessor:
				case SyntaxKind.TypeAliasDeclaration:
				case SyntaxKind.TypeParameter:
				case SyntaxKind.VariableDeclaration:
					return node.parent.name === node;

				case SyntaxKind.ExportSpecifier:
					return node.parent.propertyName === node;

				case SyntaxKind.ImportClause:
				case SyntaxKind.ImportSpecifier:
				case SyntaxKind.NamespaceImport:
					return true;

				case SyntaxKind.PropertyAssignment: {
					return (
						node.parent.name === node &&
						node.parent.name.kind !== SyntaxKind.ComputedPropertyName
					);
				}
			}
		}

		function getCallLikeExpression(node: AST.AnyNode) {
			let current = node;

			while (
				current.parent.kind === SyntaxKind.PropertyAccessExpression &&
				current.parent.name === current
			) {
				current = current.parent;
			}

			while (
				current.parent.kind === SyntaxKind.ElementAccessExpression &&
				current.parent.argumentExpression === current
			) {
				current = current.parent;
			}

			switch (current.parent.kind) {
				case SyntaxKind.CallExpression:
				case SyntaxKind.Decorator:
				case SyntaxKind.NewExpression:
					return current.parent.expression === current && current.parent;

				case SyntaxKind.TaggedTemplateExpression:
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
				callLike as ts.CallLikeExpression,
			);
			const symbol = typeChecker.getSymbolAtLocation(node);

			const aliasedSymbol =
				symbol && symbol.flags & ts.SymbolFlags.Alias
					? typeChecker.getAliasedSymbol(symbol)
					: symbol;

			const symbolDeclarationKind = aliasedSymbol?.declarations?.[0]?.kind;

			if (
				symbolDeclarationKind !== SyntaxKind.MethodDeclaration &&
				symbolDeclarationKind !== SyntaxKind.FunctionDeclaration &&
				symbolDeclarationKind !== SyntaxKind.MethodSignature
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
			sourceFile: AST.SourceFile,
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
				node.parent.kind === SyntaxKind.ShorthandPropertyAssignment &&
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
			sourceFile: AST.SourceFile,
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
			sourceFile: AST.SourceFile,
			typeChecker: ts.TypeChecker,
		) {
			const bindingPattern = node.parent;
			if (bindingPattern.kind !== SyntaxKind.ObjectBindingPattern) {
				return;
			}

			const propertyName = node.propertyName ?? node.name;
			if (propertyName.kind !== SyntaxKind.Identifier) {
				return;
			}

			const declarationOrPattern = bindingPattern.parent;
			let objectType: ts.Type | undefined;

			if (declarationOrPattern.kind === SyntaxKind.VariableDeclaration) {
				const initializer = declarationOrPattern.initializer;
				if (initializer) {
					objectType = typeChecker.getTypeAtLocation(initializer);
				}
			} else if (declarationOrPattern.kind === SyntaxKind.BindingElement) {
				const parentInitializer = declarationOrPattern.parent.parent;
				if (parentInitializer.kind === SyntaxKind.VariableDeclaration) {
					const init = parentInitializer.initializer;
					if (init) {
						const parentType = typeChecker.getTypeAtLocation(init);
						const parentPropertyName =
							declarationOrPattern.propertyName ?? declarationOrPattern.name;
						if (parentPropertyName.kind === SyntaxKind.Identifier) {
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
					if (reportNode.kind === SyntaxKind.Identifier) {
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
			sourceFile: AST.SourceFile,
			typeChecker: ts.TypeChecker,
		) {
			for (const type of node.types) {
				if (type.expression.kind === SyntaxKind.Identifier) {
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
			sourceFile: AST.SourceFile,
			typeChecker: ts.TypeChecker,
		) {
			const callExpr = node.parent;
			if (
				callExpr.kind !== SyntaxKind.CallExpression ||
				callExpr.expression !== node
			) {
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
						node.parent.kind === SyntaxKind.PropertyAccessExpression &&
						node === node.parent.name
					) {
						checkNode(node, sourceFile, typeChecker);
						return;
					}

					if (
						node.parent.kind === SyntaxKind.QualifiedName &&
						node === node.parent.right
					) {
						checkNode(node, sourceFile, typeChecker);
						return;
					}

					if (
						node.parent.kind === SyntaxKind.ElementAccessExpression &&
						node === node.parent.argumentExpression
					) {
						return;
					}

					checkNode(node, sourceFile, typeChecker);
				},

				PrivateIdentifier: (node, { sourceFile, typeChecker }) => {
					if (
						node.parent.kind === SyntaxKind.PropertyAccessExpression &&
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
	if (node.kind === SyntaxKind.HeritageClause) {
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
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- removing causes type error on the `while` loop. TSESLint bug?
		current = current.parent as ts.Node | undefined;
	}

	return false;
}

// TODO (#400): Switch to scope analysis
function isInsideImport(node: AST.AnyNode) {
	if (node.kind === SyntaxKind.ImportDeclaration) {
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

		// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- removing causes type error on the `while` loop. TSESLint bug?
		current = current.parent as ts.Node | undefined;
	}

	return false;
}
