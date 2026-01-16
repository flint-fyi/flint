import type * as ts from "typescript";

export interface JsonNodesByName {
	ArrayLiteralExpression: ts.ArrayLiteralExpression;
	BooleanLiteral: ts.BooleanLiteral;
	JsonMinusNumericLiteral: ts.JsonMinusNumericLiteral;
	JsonObjectExpressionStatement: ts.JsonObjectExpressionStatement;
	JsonSourceFile: ts.JsonSourceFile;
	NullLiteral: ts.NullLiteral;
	NumericLiteral: ts.NumericLiteral;
	ObjectLiteralExpression: ts.ObjectLiteralExpression;
	StringLiteral: ts.StringLiteral;
}
