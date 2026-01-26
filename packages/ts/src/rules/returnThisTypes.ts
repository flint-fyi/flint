import {
	type AST,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as tsutils from "ts-api-utils";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

type FunctionLikeBody =
	| AST.ArrowFunction
	| AST.FunctionExpression
	| AST.GetAccessorDeclaration
	| AST.MethodDeclaration;

function allReturnsAreThis(body: ts.Node, aliases: Set<string>): boolean {
	const returnStatements: ts.ReturnStatement[] = [];

	function collectReturns(node: ts.Node): void {
		if (tsutils.isFunctionScopeBoundary(node)) {
			return;
		}

		if (ts.isReturnStatement(node)) {
			returnStatements.push(node);
			return;
		}

		ts.forEachChild(node, collectReturns);
	}

	ts.forEachChild(body, collectReturns);

	if (returnStatements.length === 0) {
		return false;
	}

	let hasThisReturn = false;
	for (const returnStmt of returnStatements) {
		if (!returnStmt.expression) {
			continue;
		}
		if (isThisOrAlias(returnStmt.expression, aliases)) {
			hasThisReturn = true;
		} else {
			return false;
		}
	}

	return hasThisReturn;
}

function collectThisAliases(body: ts.Node): Set<string> {
	const aliases = new Set<string>();

	function visit(node: ts.Node): void {
		if (
			ts.isVariableDeclaration(node) &&
			ts.isIdentifier(node.name) &&
			node.initializer?.kind === ts.SyntaxKind.ThisKeyword
		) {
			aliases.add(node.name.text);
		}
		ts.forEachChild(node, visit);
	}

	ts.forEachChild(body, visit);
	return aliases;
}

function findClassTypeReferenceNode(
	typeNode: ts.TypeNode,
	className: string,
	typeChecker: ts.TypeChecker,
	classSymbol: ts.Symbol | undefined,
): ts.TypeReferenceNode | undefined {
	if (ts.isTypeReferenceNode(typeNode)) {
		const typeName = typeNode.typeName;
		if (ts.isIdentifier(typeName) && typeName.text === className) {
			const symbol = typeChecker.getSymbolAtLocation(typeName);
			if (symbol && classSymbol) {
				const resolvedSymbol =
					symbol.flags & ts.SymbolFlags.Alias
						? typeChecker.getAliasedSymbol(symbol)
						: symbol;
				const resolvedClassSymbol =
					classSymbol.flags & ts.SymbolFlags.Alias
						? typeChecker.getAliasedSymbol(classSymbol)
						: classSymbol;
				if (resolvedSymbol === resolvedClassSymbol) {
					return typeNode;
				}
			} else {
				return typeNode;
			}
		}
	}

	if (ts.isUnionTypeNode(typeNode)) {
		for (const type of typeNode.types) {
			const found = findClassTypeReferenceNode(
				type,
				className,
				typeChecker,
				classSymbol,
			);
			if (found) {
				return found;
			}
		}
	}

	return undefined;
}

function getClassName(
	classNode: AST.ClassDeclaration | AST.ClassExpression,
): string | undefined {
	return classNode.name?.text;
}

function getEnclosingClass(
	node: ts.Node,
): AST.ClassDeclaration | AST.ClassExpression | undefined {
	let current = node.parent as ts.Node | undefined;
	while (current) {
		if (ts.isClassDeclaration(current) || ts.isClassExpression(current)) {
			return current as AST.ClassDeclaration | AST.ClassExpression;
		}
		current = current.parent;
	}
	return undefined;
}

function hasExplicitThisParameter(node: FunctionLikeBody): boolean {
	const firstParam = node.parameters[0];
	if (!firstParam) {
		return false;
	}
	return ts.isIdentifier(firstParam.name) && firstParam.name.text === "this";
}

function hasModifier(
	modifiers: ts.NodeArray<AST.ModifierLike> | undefined,
	kind: ts.SyntaxKind,
): boolean {
	return modifiers?.some((modifier) => modifier.kind === kind) ?? false;
}

function isArrowReturningThis(
	arrow: AST.ArrowFunction,
	aliases: Set<string>,
): boolean {
	if (!ts.isBlock(arrow.body)) {
		return isThisOrAlias(arrow.body, aliases);
	}
	return allReturnsAreThis(arrow.body, aliases);
}

function isThisOrAlias(
	expression: ts.Expression,
	aliases: Set<string>,
): boolean {
	if (expression.kind === ts.SyntaxKind.ThisKeyword) {
		return true;
	}
	if (ts.isIdentifier(expression) && aliases.has(expression.text)) {
		return true;
	}
	return false;
}

function typeReferencesClass(
	typeNode: ts.TypeNode,
	className: string,
	typeChecker: ts.TypeChecker,
	classSymbol: ts.Symbol | undefined,
): boolean {
	if (ts.isTypeReferenceNode(typeNode)) {
		const typeName = typeNode.typeName;
		if (ts.isIdentifier(typeName) && typeName.text === className) {
			const symbol = typeChecker.getSymbolAtLocation(typeName);
			if (symbol && classSymbol) {
				const resolvedSymbol =
					symbol.flags & ts.SymbolFlags.Alias
						? typeChecker.getAliasedSymbol(symbol)
						: symbol;
				const resolvedClassSymbol =
					classSymbol.flags & ts.SymbolFlags.Alias
						? typeChecker.getAliasedSymbol(classSymbol)
						: classSymbol;
				return resolvedSymbol === resolvedClassSymbol;
			}
			return true;
		}
	}

	if (ts.isUnionTypeNode(typeNode)) {
		return typeNode.types.some((type) =>
			typeReferencesClass(type, className, typeChecker, classSymbol),
		);
	}

	return false;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Prefer `this` return type over explicit class name when returning `this`.",
		id: "returnThisTypes",
		presets: ["logical"],
	},
	messages: {
		preferThisReturnType: {
			primary:
				"Use `this` as the return type instead of the class name for polymorphic chaining.",
			secondary: [
				"Using `this` preserves method chaining behavior in subclasses.",
			],
			suggestions: ["Replace the class name with `this`."],
		},
	},
	setup(context) {
		function checkMember(
			node: AST.GetAccessorDeclaration | AST.MethodDeclaration,
			{ sourceFile, typeChecker }: TypeScriptFileServices,
		) {
			if (hasModifier(node.modifiers, ts.SyntaxKind.StaticKeyword)) {
				return;
			}

			if (!node.type || !node.body) {
				return;
			}

			if (node.type.kind === ts.SyntaxKind.ThisType) {
				return;
			}

			if (hasExplicitThisParameter(node)) {
				return;
			}

			const classNode = getEnclosingClass(node);
			if (!classNode) {
				return;
			}

			const className = getClassName(classNode);
			if (!className) {
				return;
			}

			const classSymbol = classNode.name
				? typeChecker.getSymbolAtLocation(classNode.name)
				: undefined;

			if (
				!typeReferencesClass(node.type, className, typeChecker, classSymbol)
			) {
				return;
			}

			const aliases = collectThisAliases(node.body);
			if (!allReturnsAreThis(node.body, aliases)) {
				return;
			}

			const typeReferenceNode = findClassTypeReferenceNode(
				node.type,
				className,
				typeChecker,
				classSymbol,
			);
			if (!typeReferenceNode) {
				return;
			}

			context.report({
				fix: {
					range: {
						begin: typeReferenceNode.getStart(sourceFile),
						end: typeReferenceNode.getEnd(),
					},
					text: "this",
				},
				message: "preferThisReturnType",
				range: {
					begin: typeReferenceNode.getStart(sourceFile),
					end: typeReferenceNode.getEnd(),
				},
			});
		}

		function checkPropertyFunction(
			node: AST.PropertyDeclaration,
			services: TypeScriptFileServices,
		) {
			const { sourceFile, typeChecker } = services;

			if (hasModifier(node.modifiers, ts.SyntaxKind.StaticKeyword)) {
				return;
			}

			if (!node.initializer) {
				return;
			}

			if (
				!ts.isFunctionExpression(node.initializer) &&
				!ts.isArrowFunction(node.initializer)
			) {
				return;
			}

			const func = node.initializer;
			const funcType = func.type;

			if (!funcType) {
				return;
			}

			if (funcType.kind === ts.SyntaxKind.ThisType) {
				return;
			}

			if (hasExplicitThisParameter(func)) {
				return;
			}

			const classNode = getEnclosingClass(node);
			if (!classNode) {
				return;
			}

			const className = getClassName(classNode);
			if (!className) {
				return;
			}

			const classSymbol = classNode.name
				? typeChecker.getSymbolAtLocation(classNode.name)
				: undefined;

			if (!typeReferencesClass(funcType, className, typeChecker, classSymbol)) {
				return;
			}

			const { body } = func;

			const aliases = ts.isBlock(body)
				? collectThisAliases(body)
				: new Set<string>();

			if (ts.isArrowFunction(func)) {
				if (!isArrowReturningThis(func, aliases)) {
					return;
				}
			} else if (!allReturnsAreThis(body, aliases)) {
				return;
			}

			const typeReferenceNode = findClassTypeReferenceNode(
				funcType,
				className,
				typeChecker,
				classSymbol,
			);
			if (!typeReferenceNode) {
				return;
			}

			context.report({
				fix: {
					range: {
						begin: typeReferenceNode.getStart(sourceFile),
						end: typeReferenceNode.getEnd(),
					},
					text: "this",
				},
				message: "preferThisReturnType",
				range: {
					begin: typeReferenceNode.getStart(sourceFile),
					end: typeReferenceNode.getEnd(),
				},
			});
		}

		return {
			visitors: {
				GetAccessor: checkMember,
				MethodDeclaration: checkMember,
				PropertyDeclaration: checkPropertyFunction,
			},
		};
	},
});
