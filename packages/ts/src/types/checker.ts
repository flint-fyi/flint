import type {
	Node,
	Signature,
	TupleTypeReference,
	Type,
	TypeChecker,
	TypeReference,
} from "typescript";
import type ts from "typescript";

import * as AST from "./ast.ts";

export type Checker = CheckerOverrides &
	Omit<TypeChecker, keyof CheckerOverrides>;

interface CheckerOverrides {
	/** Fix Expression _Brand check */
	getContextualType(node: AST.Expression | ts.Expression): Type | undefined;
	getResolvedSignature(
		node:
			| AST.CallExpression
			| AST.Decorator
			| AST.JsxOpeningElement
			| AST.JsxSelfClosingElement
			| AST.NewExpression
			| AST.TaggedTemplateExpression
			| ts.CallLikeExpression,
	): Signature | undefined;
	getTypeFromTypeNode(node: AST.TypeNode | ts.TypeNode): Type;
	/** Improve narrowing, borrow from typescript-eslint */
	isArrayType(type: Type): type is TypeReference;
	isTupleType(type: Type): type is TupleTypeReference;

	/**
	 * TS internal api
	 * Return the type of the given property in the given type, or undefined if no such property exists
	 */
	getTypeOfPropertyOfType(type: Type, propertyName: string): Type | undefined;

	/**
	 * TS internal api
	 */
	getContextualTypeForArgumentAtIndex(node: Node, argIndex: number): Type;
}
