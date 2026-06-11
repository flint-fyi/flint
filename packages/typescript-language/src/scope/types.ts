import type * as AST from "../types/ast.ts";

export type FunctionWithParameters =
	| AST.ArrowFunction
	| AST.ConstructorDeclaration
	| AST.FunctionDeclaration
	| AST.FunctionExpression
	| AST.GetAccessorDeclaration
	| AST.MethodDeclaration
	| AST.SetAccessorDeclaration;

export interface Scope {
	block: AST.AnyNode;
	childScopes: Scope[];
	references: ScopeReference[];
	upper: Scope | undefined;
	variables: ScopeVariable[];
}

export interface ScopeInternal extends Scope {
	// TODO: Many scopes have no child scopes and/or variables; making these
	// optional (or dropping them) may cut allocations, once we can measure it.
	// https://github.com/flint-fyi/flint/issues/2627
	childScopes: ScopeInternal[];
	upper: ScopeInternal | undefined;
	variablesByName: Map<string, ScopeVariable>;
}

export interface ScopeManager {
	findVariable(identifier: AST.Identifier): ScopeVariable | undefined;
	getDeclaredVariables(node: AST.AnyNode): ScopeVariable[];
	getReferencesInScope(node: AST.AnyNode): ScopeReference[];
	getScope(node: AST.AnyNode): Scope;
	globalScope: Scope;
}

export interface ScopeReference {
	from: Scope;
	identifier: AST.Identifier;
	isWrite: boolean;
	text: string;
	variable: ScopeVariable | undefined;
}

export interface ScopeVariable {
	declarations: AST.Identifier[];
	name: string;
	references: ScopeReference[];
	scope: Scope;
}
