import type { AST } from "@flint.fyi/typescript-language";
import * as ts from "typescript";

export function isDirectEqualityCheck(
	node: AST.ArrowFunction | AST.FunctionExpression,
	operators: ts.SyntaxKind[],
	parameterName: string,
) {
	let body: AST.Expression | undefined;

	switch (node.kind) {
		case ts.SyntaxKind.ArrowFunction:
			body =
				node.body.kind === ts.SyntaxKind.Block
					? getDirectReturnExpression(node.body)
					: node.body;
			break;

		case ts.SyntaxKind.FunctionExpression:
			body = getDirectReturnExpression(node.body);
			break;
	}

	if (!body || !ts.isBinaryExpression(body)) {
		return undefined;
	}

	const { left, operatorToken, right } = body;

	if (!operators.includes(operatorToken.kind)) {
		return undefined;
	}

	const isLeftParam = ts.isIdentifier(left) && left.text === parameterName;
	const isRightParam = ts.isIdentifier(right) && right.text === parameterName;

	if (isLeftParam && !isRightParam) {
		return right;
	}
	if (isRightParam && !isLeftParam) {
		return left;
	}

	return undefined;
}

function getDirectReturnExpression(body: AST.Block) {
	if (body.statements.length !== 1) {
		return undefined;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const statement = body.statements[0]!;

	return statement.kind === ts.SyntaxKind.ReturnStatement
		? statement.expression
		: undefined;
}
