import { SyntaxKind } from "typescript-native/unstable/ast";
import { expectTypeOf } from "vitest";

import type {
	AssignmentOperatorToken,
	Declaration,
	Expression,
	ForInStatement,
	ForOfStatement,
	FunctionDeclaration,
	IterationStatement,
	KeywordTypeNode,
	LeftHandSideExpressionParent,
	Node,
	Statement,
	Token,
	UnaryExpression,
} from "./ast.ts";

declare const node: Node;
if (node.kind === SyntaxKind.Identifier) {
	expectTypeOf(node.text).toBeString();
}
if (node.kind === SyntaxKind.OpenBraceToken) {
	expectTypeOf(node).toEqualTypeOf<Token<SyntaxKind.OpenBraceToken>>();
}

expectTypeOf<
	Extract<Node, { kind: SyntaxKind.SemicolonToken }>
>().not.toBeNever();
expectTypeOf<
	Extract<Node, AssignmentOperatorToken>
>().not.toEqualTypeOf<AssignmentOperatorToken>();
expectTypeOf<
	Extract<KeywordTypeNode, { kind: SyntaxKind.AnyKeyword }>
>().not.toBeNever();
expectTypeOf<
	Extract<Declaration, FunctionDeclaration>
>().toEqualTypeOf<FunctionDeclaration>();
expectTypeOf<
	Extract<Statement, FunctionDeclaration>
>().toEqualTypeOf<FunctionDeclaration>();
expectTypeOf<LeftHandSideExpressionParent>().toExtend<Node>();
expectTypeOf<ForInStatement>().toExtend<IterationStatement>();
expectTypeOf<ForOfStatement>().toExtend<IterationStatement>();

declare const declaration: Declaration;
declare const expression: Expression;
declare const statement: Statement;
declare const unaryExpression: UnaryExpression;
expectTypeOf(declaration).toExtend<Node>();
expectTypeOf(expression).toExtend<Node>();
expectTypeOf(statement).toExtend<Node>();
expectTypeOf(unaryExpression).toExtend<Expression>();
