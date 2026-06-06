import * as tsutils from "ts-api-utils";
import { SyntaxKind } from "typescript";

import type * as AST from "../types/ast.ts";

export function isNonReferenceIdentifier(identifier: AST.Identifier) {
	if (
		isIdentifierDeclaration(identifier) ||
		isTypeReferenceIdentifier(identifier)
	) {
		return true;
	}

	const { parent } = identifier;

	switch (parent.kind) {
		case SyntaxKind.BindingElement:
		case SyntaxKind.ImportSpecifier:
			return parent.propertyName === identifier;
		case SyntaxKind.BreakStatement:
		case SyntaxKind.ContinueStatement:
		case SyntaxKind.LabeledStatement:
			return parent.label === identifier;
		case SyntaxKind.JsxAttribute:
		case SyntaxKind.MethodDeclaration:
		case SyntaxKind.MethodSignature:
		case SyntaxKind.PropertyAccessExpression:
		case SyntaxKind.PropertyAssignment:
		case SyntaxKind.PropertyDeclaration:
		case SyntaxKind.PropertySignature:
			return parent.name === identifier;
	}

	return false;
}

export function isWriteReference(identifier: AST.Identifier) {
	const { parent } = identifier;

	if (isAssignmentTarget(identifier)) {
		return true;
	}

	switch (parent.kind) {
		case SyntaxKind.PostfixUnaryExpression:
		case SyntaxKind.PrefixUnaryExpression:
			return (
				parent.operand === identifier &&
				(parent.operator === SyntaxKind.PlusPlusToken ||
					parent.operator === SyntaxKind.MinusMinusToken)
			);

		default:
			return false;
	}
}

function isAssignmentTarget(identifier: AST.Identifier) {
	let current: AST.AnyNode = identifier;

	while (true) {
		const parent = current.parent as AST.AnyNode;

		switch (parent.kind) {
			case SyntaxKind.ArrayLiteralExpression:
			case SyntaxKind.ObjectLiteralExpression:
			case SyntaxKind.ShorthandPropertyAssignment:
				current = parent;
				continue;

			case SyntaxKind.PropertyAssignment:
				if (parent.name === current) {
					return false;
				}

				current = parent;
				continue;

			case SyntaxKind.BinaryExpression:
				return (
					parent.left === current &&
					tsutils.isAssignmentKind(parent.operatorToken.kind)
				);

			case SyntaxKind.ForInStatement:
			case SyntaxKind.ForOfStatement:
				return parent.initializer === current;
		}

		return false;
	}
}

function isIdentifierDeclaration(identifier: AST.Identifier) {
	const { parent } = identifier;

	switch (parent.kind) {
		case SyntaxKind.BindingElement:
		case SyntaxKind.Parameter:
		case SyntaxKind.VariableDeclaration:
			return isIdentifierWithinParent(identifier, parent.name);
		case SyntaxKind.ClassDeclaration:
		case SyntaxKind.ClassExpression:
		case SyntaxKind.FunctionDeclaration:
		case SyntaxKind.FunctionExpression:
		case SyntaxKind.InterfaceDeclaration:
		case SyntaxKind.ModuleDeclaration:
		case SyntaxKind.TypeAliasDeclaration:
			return parent.name === identifier;

		case SyntaxKind.ImportClause:
		case SyntaxKind.ImportSpecifier:
		case SyntaxKind.NamespaceImport:
			return parent.name === identifier;
	}

	return false;
}

function isIdentifierWithinParent(
	identifier: AST.Identifier,
	parent: AST.AnyNode,
) {
	let current: AST.AnyNode = identifier;

	while (current !== parent) {
		const next = current.parent as AST.AnyNode | undefined;
		if (!next) {
			return false;
		}

		current = next;
	}

	return true;
}

function isTypeReferenceIdentifier(identifier: AST.Identifier) {
	let current: AST.AnyNode = identifier;

	while ((current.parent as AST.AnyNode).kind === SyntaxKind.QualifiedName) {
		current = current.parent as AST.AnyNode;
	}

	const parent = current.parent as AST.AnyNode;
	if (parent.kind !== SyntaxKind.TypeReference) {
		return false;
	}

	return isIdentifierWithinParent(identifier, parent.typeName);
}
