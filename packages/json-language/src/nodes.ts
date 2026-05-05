import type { WithExitKeys } from "@flint.fyi/core";
import type { AST } from "@flint.fyi/typescript-language";
import type * as ts from "typescript";

export type JsonMinusNumericLiteral = Omit<
	AST.PrefixUnaryExpression,
	"operand" | "operator"
> & {
	readonly operand: AST.NumericLiteral;
	readonly operator: ts.SyntaxKind.MinusToken;
};

export type JsonNode = JsonNodesByName[JsonNodeName];

export type JsonNodeName = keyof JsonNodesByName;

export interface JsonNodesByName {
	ArrayLiteralExpression: AST.ArrayLiteralExpression;
	BooleanLiteral: AST.BooleanLiteral;
	JsonMinusNumericLiteral: JsonMinusNumericLiteral;
	JsonObjectExpressionStatement: JsonObjectExpressionStatement;
	JsonSourceFile: JsonSourceFile;
	NullLiteral: AST.NullLiteral;
	NumericLiteral: AST.NumericLiteral;
	ObjectLiteralExpression: AST.ObjectLiteralExpression;
	StringLiteral: AST.StringLiteral;
}

export type JsonNodeVisitors = WithExitKeys<JsonNodesByName>;

export type JsonObjectExpression =
	| AST.ArrayLiteralExpression
	| AST.BooleanLiteral
	| AST.NullLiteral
	| AST.NumericLiteral
	| AST.ObjectLiteralExpression
	| AST.StringLiteral
	| JsonMinusNumericLiteral;

export type JsonObjectExpressionStatement = Omit<
	AST.ExpressionStatement,
	"expression"
> & {
	readonly expression: JsonObjectExpression;
};

export type JsonSourceFile = Omit<AST.SourceFile, "statements"> & {
	readonly statements: ts.NodeArray<JsonObjectExpressionStatement>;
};
