import { WeakCachedFactory } from "cached-factory";
import { SyntaxKind } from "typescript";

import type * as AST from "../types/ast.ts";
import { forEachChild } from "../utils/forEachChild.ts";
import {
	isNonReferenceIdentifier,
	isWriteReference,
} from "./identifierReferences.ts";
import {
	createScope,
	getReferencesInScope,
	getVariableDeclarationScope,
	isScopeBoundary,
	resolveVariable,
} from "./scopes.ts";
import type {
	FunctionWithParameters,
	ScopeDefinitionKind,
	ScopeInternal,
	ScopeManager,
	ScopeReference,
	ScopeVariable,
} from "./types.ts";

export type {
	FunctionWithParameters,
	Scope,
	ScopeDefinition,
	ScopeDefinitionKind,
	ScopeManager,
	ScopeReference,
	ScopeVariable,
} from "./types.ts";

const scopeManagers = new WeakCachedFactory<AST.SourceFile, ScopeManager>(
	createScopeManager,
);

export function getScopeManager(sourceFile: AST.SourceFile) {
	return scopeManagers.get(sourceFile);
}

function createScopeManager(sourceFile: AST.SourceFile) {
	const declarationVariablesByIdentifier = new WeakMap<
		AST.Identifier,
		ScopeVariable
	>();
	const declaredVariablesByNode = new WeakMap<AST.AnyNode, ScopeVariable[]>();
	const nodeScopes = new WeakMap<AST.AnyNode, ScopeInternal>();
	const globalScope = createScope(sourceFile, undefined);

	function addBindingName(
		scope: ScopeInternal,
		name: AST.BindingName,
		node: AST.AnyNode,
		kind: ScopeDefinitionKind,
	) {
		if (name.kind === SyntaxKind.Identifier) {
			return [addVariable(scope, name, node, kind)];
		}

		const variables: ScopeVariable[] = [];
		for (const element of name.elements) {
			if (element.kind !== SyntaxKind.OmittedExpression) {
				variables.push(...addBindingName(scope, element.name, node, kind));
			}
		}

		return variables;
	}

	function addImportVariables(
		scope: ScopeInternal,
		node: AST.ImportDeclaration,
	) {
		if (!node.importClause || node.importClause.isTypeOnly) {
			return;
		}

		if (node.importClause.name) {
			addVariable(scope, node.importClause.name, node, "import");
		}

		const { namedBindings } = node.importClause;
		if (!namedBindings) {
			return;
		}

		if (namedBindings.kind === SyntaxKind.NamespaceImport) {
			addVariable(scope, namedBindings.name, node, "import");
			return;
		}

		for (const element of namedBindings.elements) {
			if (element.isTypeOnly) {
				continue;
			}

			addVariable(scope, element.name, node, "import");
		}
	}

	function addParameters(scope: ScopeInternal, node: FunctionWithParameters) {
		for (const parameter of node.parameters) {
			const variables = addBindingName(
				scope,
				parameter.name,
				node,
				"parameter",
			);
			declaredVariablesByNode.set(parameter, variables);
		}
	}

	function addVariable(
		scope: ScopeInternal,
		identifier: AST.Identifier,
		node: AST.AnyNode,
		kind: ScopeDefinitionKind,
	) {
		let variable = scope.variablesByName.get(identifier.text);
		if (!variable) {
			variable = {
				declarations: [],
				definitions: [],
				name: identifier.text,
				references: [],
				scope,
			};
			scope.variablesByName.set(identifier.text, variable);
			scope.variables.push(variable);
		}

		variable.declarations.push(identifier);
		variable.definitions.push({ identifier, kind, node });
		declarationVariablesByIdentifier.set(identifier, variable);

		const declaredVariables = declaredVariablesByNode.get(node) ?? [];
		declaredVariables.push(variable);
		declaredVariablesByNode.set(node, declaredVariables);

		return variable;
	}

	function collectDeclarations(node: AST.AnyNode, scope: ScopeInternal) {
		const nodeScope =
			node !== sourceFile && isScopeBoundary(node)
				? createScope(node, scope)
				: scope;
		// TODO: Storing every node costs memory per node when most are never
		// looked up; consider resolving a node's scope lazily by walking up to
		// the nearest boundary parent, once we can measure the tradeoff.
		// https://github.com/flint-fyi/flint/issues/2627
		nodeScopes.set(node, nodeScope);

		switch (node.kind) {
			case SyntaxKind.ArrowFunction:
			case SyntaxKind.Constructor:
			case SyntaxKind.GetAccessor:
			case SyntaxKind.MethodDeclaration:
			case SyntaxKind.SetAccessor:
				addParameters(nodeScope, node);
				break;
			case SyntaxKind.CatchClause:
				if (node.variableDeclaration) {
					addBindingName(
						nodeScope,
						node.variableDeclaration.name,
						node,
						"catch",
					);
				}
				break;
			case SyntaxKind.ClassDeclaration:
				if (node.name) {
					addVariable(nodeScope, node.name, node, "class");
				}
				break;

			case SyntaxKind.ClassExpression:
				if (node.name) {
					addVariable(nodeScope, node.name, node, "class");
				}
				break;

			case SyntaxKind.FunctionDeclaration:
				if (node.name) {
					addVariable(scope, node.name, node, "function");
				}
				addParameters(nodeScope, node);
				break;

			case SyntaxKind.FunctionExpression:
				if (node.name) {
					addVariable(nodeScope, node.name, node, "function");
				}
				addParameters(nodeScope, node);
				break;

			case SyntaxKind.ImportDeclaration:
				addImportVariables(nodeScope, node);
				break;

			case SyntaxKind.VariableDeclaration:
				if (node.parent.kind === SyntaxKind.CatchClause) {
					forEachChild(node, (child) => {
						collectDeclarations(child, nodeScope);
					});
					return;
				}

				addBindingName(
					getVariableDeclarationScope(node, nodeScope),
					node.name,
					node,
					"variable",
				);
				break;
		}

		forEachChild(node, (child) => {
			collectDeclarations(child, nodeScope);
		});
	}

	function collectReferences(node: AST.AnyNode) {
		if (
			node.kind === SyntaxKind.Identifier &&
			!isNonReferenceIdentifier(node)
		) {
			const scope = nodeScopes.get(node) ?? globalScope;
			const variable = resolveVariable(scope, node.text);
			const reference: ScopeReference = {
				from: scope,
				identifier: node,
				isWrite: isWriteReference(node),
				text: node.text,
				variable,
			};

			scope.references.push(reference);
			variable?.references.push(reference);
		}

		forEachChild(node, collectReferences);
	}

	collectDeclarations(sourceFile, globalScope);
	collectReferences(sourceFile);

	return {
		findVariable(identifier) {
			const declarationVariable =
				declarationVariablesByIdentifier.get(identifier);
			if (declarationVariable) {
				return declarationVariable;
			}

			const scope = nodeScopes.get(identifier) ?? globalScope;
			return resolveVariable(scope, identifier.text);
		},
		getDeclaredVariables(node) {
			return declaredVariablesByNode.get(node) ?? [];
		},
		getReferencesInScope(node) {
			return getReferencesInScope(nodeScopes.get(node) ?? globalScope);
		},
		getScope(node) {
			return nodeScopes.get(node) ?? globalScope;
		},
		globalScope,
	} satisfies ScopeManager;
}
