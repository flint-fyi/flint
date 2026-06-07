import ts, { SyntaxKind } from "typescript";

import type * as AST from "../types/ast.ts";
import type {
	FunctionWithParameters,
	ScopeInternal,
	ScopeVariable,
} from "./types.ts";

export function createScope(
	block: AST.AnyNode,
	upper: ScopeInternal | undefined,
) {
	const variablesByName = new Map<string, ScopeVariable>();
	const scope: ScopeInternal = {
		block,
		childScopes: [],
		references: [],
		upper,
		variables: [],
		variablesByName,
	};

	Object.defineProperty(scope, "variablesByName", {
		enumerable: false,
		value: variablesByName,
	});

	upper?.childScopes.push(scope);

	return scope;
}

// TODO: Consider a generator/iterator design to avoid allocating a full array
// when callers bail out early, once we can measure the tradeoff.
// https://github.com/flint-fyi/flint/issues/2627
export function getReferencesInScope(scope: ScopeInternal) {
	const references = [...scope.references];

	for (const childScope of scope.childScopes) {
		if (!isFunctionLike(childScope.block)) {
			references.push(...getReferencesInScope(childScope));
		}
	}

	return references;
}

export function getVariableDeclarationScope(
	node: AST.VariableDeclaration,
	scope: ScopeInternal,
) {
	if (
		node.parent.kind === SyntaxKind.VariableDeclarationList &&
		!(node.parent.flags & ts.NodeFlags.BlockScoped)
	) {
		return findContainingVariableScope(scope);
	}

	return scope;
}

export function isScopeBoundary(node: AST.AnyNode) {
	return (
		isFunctionLike(node) ||
		node.kind === SyntaxKind.CatchClause ||
		node.kind === SyntaxKind.ClassExpression ||
		node.kind === SyntaxKind.ForInStatement ||
		node.kind === SyntaxKind.ForOfStatement ||
		node.kind === SyntaxKind.ForStatement ||
		isBlockScopeBoundary(node)
	);
}

export function resolveVariable(scope: ScopeInternal, name: string) {
	let current: ScopeInternal | undefined = scope;

	while (current) {
		const variable = current.variablesByName.get(name);
		if (variable) {
			return variable;
		}

		current = current.upper;
	}
}

function findContainingVariableScope(scope: ScopeInternal) {
	let current = scope;

	while (current.upper && !isVariableScopeBoundary(current.block)) {
		current = current.upper;
	}

	return current;
}

function isBlockScopeBoundary(node: AST.AnyNode) {
	return (
		node.kind === SyntaxKind.Block &&
		node.parent.kind !== SyntaxKind.CatchClause &&
		!isFunctionLike(node.parent)
	);
}

function isFunctionLike(
	node: AST.AnyNode | undefined,
): node is FunctionWithParameters {
	switch (node?.kind) {
		case SyntaxKind.ArrowFunction:
		case SyntaxKind.Constructor:
		case SyntaxKind.FunctionDeclaration:
		case SyntaxKind.FunctionExpression:
		case SyntaxKind.GetAccessor:
		case SyntaxKind.MethodDeclaration:
		case SyntaxKind.SetAccessor:
			return true;

		default:
			return false;
	}
}

function isVariableScopeBoundary(node: AST.AnyNode) {
	return node.kind === SyntaxKind.SourceFile || isFunctionLike(node);
}
