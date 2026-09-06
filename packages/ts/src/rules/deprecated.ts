import * as ts from "typescript-native/unstable/ast";
import { SyntaxKind } from "typescript-native/unstable/ast";
import {
	SymbolFlags,
	TypeFlags,
	type JSDocTagInfo,
	type Signature,
	type Symbol,
	type Type,
} from "typescript-native/unstable/sync";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type Checker,
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
			symbol: Signature | Symbol | undefined,
			typeChecker: Checker,
		): boolean {
			if (!symbol) {
				return false;
			}

			if ("getReturnType" in symbol) {
				const declaration = symbol.declaration?.resolve() as
					| AST.Declaration
					| undefined;
				return (
					!!declaration &&
					(hasDeprecationTag(declaration) ||
						hasInheritedDeprecationTag(declaration, typeChecker))
				);
			}

			let jsDocTags: readonly JSDocTagInfo[];
			try {
				jsDocTags = symbol.getJsDocTags(typeChecker);
			} catch {
				return false;
			}

			if (jsDocTags.some((tag) => tag.name === "deprecated")) {
				return true;
			}

			// Symbols with multiple declarations, such as function overloads, are
			// handled by their resolved signature's declaration instead
			if (symbol.declarations.length !== 1) {
				return false;
			}

			const declaration = symbol.declarations[0]?.resolve() as
				| AST.Declaration
				| undefined;
			return (
				!!declaration && hasInheritedDeprecationTag(declaration, typeChecker)
			);
		}

		function hasDeprecationTag(declaration: AST.Declaration): boolean {
			return ts
				.getJSDocTags(declaration)
				.some(
					(tag) =>
						tag.tagName.text === "deprecated" ||
						tag.tagName.text === "Deprecated",
				);
		}

		// JSDoc tags are inherited from base declarations, such as when a class
		// member overrides a deprecated member from its base class or interface.
		function hasInheritedDeprecationTag(
			declaration: AST.Declaration,
			typeChecker: Checker,
		): boolean {
			switch (declaration.kind) {
				case SyntaxKind.GetAccessor:
				case SyntaxKind.MethodDeclaration:
				case SyntaxKind.MethodSignature:
				case SyntaxKind.PropertyDeclaration:
				case SyntaxKind.PropertySignature:
				case SyntaxKind.SetAccessor: {
					// A declaration with its own JSDoc tags overrides inherited ones
					if (ts.getJSDocTags(declaration).length) {
						return false;
					}

					const { name, parent } = declaration;
					if (
						name.kind !== SyntaxKind.Identifier ||
						(parent.kind !== SyntaxKind.ClassDeclaration &&
							parent.kind !== SyntaxKind.ClassExpression &&
							parent.kind !== SyntaxKind.InterfaceDeclaration)
					) {
						return false;
					}

					return !!parent.heritageClauses?.some((heritageClause) =>
						heritageClause.types.some((heritageType) => {
							const baseProperty = typeChecker
								.getTypeAtLocation(heritageType)
								.getProperty(name.text);
							return (
								baseProperty?.declarations.length === 1 &&
								isDeprecatedFromDeclarations(baseProperty)
							);
						}),
					);
				}
				default:
					return false;
			}
		}

		function isDeprecatedFromDeclarations(symbol: Symbol | undefined) {
			return symbol?.declarations.some((declarationHandle) => {
				const declaration = declarationHandle.resolve();
				if (!declaration) {
					return false;
				}
				return hasDeprecationTag(declaration as AST.Declaration);
			});
		}

		function searchForDeprecationInAliasesChain(
			symbol: Symbol | undefined,
			typeChecker: Checker,
			checkAliasedSymbol: boolean,
		) {
			if (!symbol) {
				return false;
			}

			if (!(symbol.flags & SymbolFlags.Alias)) {
				return !!(
					checkAliasedSymbol &&
					(getJsDocDeprecation(symbol, typeChecker) ||
						isDeprecatedFromDeclarations(symbol))
				);
			}

			const targetSymbol = typeChecker.getAliasedSymbol(symbol);
			let current = symbol;

			while (current.flags & SymbolFlags.Alias) {
				if (
					getJsDocDeprecation(current, typeChecker) ||
					isDeprecatedFromDeclarations(current)
				) {
					return true;
				}

				if (!current.declarations.length) {
					break;
				}

				const immediateAliased: Symbol | undefined =
					typeChecker.getImmediateAliasedSymbol(current);
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

		function isDeprecated(symbol: Symbol | undefined, typeChecker: Checker) {
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
					return "name" in node.parent && node.parent.name === node;

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
			let current: AST.AnyNode = node;

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
			typeChecker: Checker,
		) {
			const signature = typeChecker.getResolvedSignature(callLike);
			const symbol = typeChecker.getSymbolAtLocation(node);

			const aliasedSymbol =
				symbol && symbol.flags & SymbolFlags.Alias
					? typeChecker.getAliasedSymbol(symbol)
					: symbol;

			const symbolDeclarationKind =
				aliasedSymbol?.declarations[0]?.resolve()?.kind;

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
			typeChecker: Checker,
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
				const valueDeclaration = symbol?.valueDeclaration?.resolve();
				const valueSymbol = valueDeclaration
					? typeChecker.getShorthandAssignmentValueSymbol(valueDeclaration)
					: undefined;
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
			typeChecker: Checker,
		) {
			const argumentExpression = node.argumentExpression;
			const argumentType = typeChecker.getTypeAtLocation(argumentExpression);

			if (
				!(
					argumentType.flags &
					(TypeFlags.StringLiteral | TypeFlags.NumberLiteral)
				)
			) {
				return;
			}

			const objectType = typeChecker.getTypeAtLocation(node.expression);
			let propertyName: string;
			if (argumentType.flags & TypeFlags.StringLiteral) {
				propertyName = (argumentType as Type & { value: string }).value;
			} else if (argumentType.flags & TypeFlags.NumberLiteral) {
				propertyName = String((argumentType as Type & { value: number }).value);
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
			typeChecker: Checker,
		) {
			const bindingPattern = node.parent;
			if (bindingPattern.kind !== SyntaxKind.ObjectBindingPattern) {
				return;
			}

			const propertyName = node.propertyName ?? node.name;
			if (propertyName?.kind !== SyntaxKind.Identifier) {
				return;
			}

			const declarationOrPattern = bindingPattern.parent;
			let objectType: Type | undefined;

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
						if (parentPropertyName?.kind === SyntaxKind.Identifier) {
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
					if (reportNode?.kind === SyntaxKind.Identifier) {
						context.report({
							message: "deprecated",
							range: getTSNodeRange(reportNode, sourceFile),
						});
					}
				}
			}
		}

		function checkSuperCall(
			node: AST.SuperExpression,
			sourceFile: AST.SourceFile,
			typeChecker: Checker,
		) {
			const callExpr = node.parent;
			if (
				callExpr.kind !== SyntaxKind.CallExpression ||
				callExpr.expression !== node
			) {
				return;
			}

			const signature = typeChecker.getResolvedSignature(callExpr);
			if (getJsDocDeprecation(signature, typeChecker)) {
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

				Identifier: (node, { sourceFile, typeChecker }) => {
					if (isInsideHeritageClause(node)) {
						if (
							(node.parent.kind === SyntaxKind.ExpressionWithTypeArguments &&
								node.parent.expression === node &&
								node.parent.parent.kind === SyntaxKind.HeritageClause) ||
							(node.parent.kind === SyntaxKind.TypeReference &&
								node.parent.typeName === node &&
								node.parent.parent.kind === SyntaxKind.HeritageClause)
						) {
							checkNode(node, sourceFile, typeChecker);
						}
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
