import { SyntaxKind } from "typescript-native/unstable/ast";

import type { AST } from "@flint.fyi/typescript-language";

export function isDirectEqualityCheck(
	node: AST.ArrowFunction | AST.FunctionExpression,
	operators: SyntaxKind[],
	parameterName: string,
): boolean {
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
		return false;
	}

	const { left, operatorToken, right } = body;

	if (!operators.includes(operatorToken.kind)) {
		return false;
	}

	const isLeftParam =
		left.kind === SyntaxKind.Identifier && left.text === parameterName;
	const isRightParam =
		right.kind === SyntaxKind.Identifier && right.text === parameterName;

	if (isLeftParam && !isRightParam) {
		return true;
	}
	if (isRightParam && !isLeftParam) {
		return true;
	}

	return false;
}

function getDirectReturnExpression(body: AST.Block) {
	if (body.statements.length !== 1) {
		return undefined;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const statement = body.statements[0]!;

	return statement.kind === SyntaxKind.ReturnStatement
		? statement.expression
		: undefined;
}
