import { SyntaxKind } from "typescript";

import type { AST } from "@flint.fyi/typescript-language";

export function isDirectEqualityCheck(
	node: AST.ArrowFunction | AST.FunctionExpression,
	operators: SyntaxKind[],
	parameterName: string,
) {
	let body: AST.Expression | undefined;

	switch (node.kind) {
		case SyntaxKind.ArrowFunction:
			body =
				node.body.kind === SyntaxKind.Block
					? getDirectReturnExpression(node.body)
					: node.body;
			break;

		case SyntaxKind.FunctionExpression:
			body = getDirectReturnExpression(node.body);
			break;
	}

	if (body?.kind !== SyntaxKind.BinaryExpression) {
		return;
	}

	const { left, operatorToken, right } = body;

	if (!operators.includes(operatorToken.kind)) {
		return;
	}

	const isLeftParam =
		left.kind === SyntaxKind.Identifier && left.text === parameterName;
	const isRightParam =
		right.kind === SyntaxKind.Identifier && right.text === parameterName;

	if (isLeftParam && !isRightParam) {
		return right;
	}
	if (isRightParam && !isLeftParam) {
		return left;
	}

	return;
}

function getDirectReturnExpression(body: AST.Block) {
	if (body.statements.length !== 1) {
		return;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const statement = body.statements[0]!;

	return statement.kind === SyntaxKind.ReturnStatement
		? statement.expression
		: undefined;
}
