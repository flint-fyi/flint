import type { WithExitKeys } from "@flint.fyi/core";
import type { AST } from "@flint.fyi/typescript-language";
import type * as ts from "typescript";

export type JsonNode = JsonNodesByName[JsonNodeName];

export type JsonNodeName = keyof JsonNodesByName;

export interface JsonNodesByName {
	ArrayLiteralExpression: AST.ArrayLiteralExpression;
	BooleanLiteral: AST.BooleanLiteral;
	JsonMinusNumericLiteral: ts.JsonMinusNumericLiteral;
	JsonObjectExpressionStatement: ts.JsonObjectExpressionStatement;
	JsonSourceFile: AST.SourceFile;
	NullLiteral: AST.NullLiteral;
	NumericLiteral: AST.NumericLiteral;
	ObjectLiteralExpression: AST.ObjectLiteralExpression;
	StringLiteral: AST.StringLiteral;
}

export type JsonNodeVisitors = WithExitKeys<JsonNodesByName>;
