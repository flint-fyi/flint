import {
	isExpression,
	isStatement,
	type ExpressionBase,
	type StatementBase,
} from "typescript-native/unstable/ast";

import type { AST } from "@flint.fyi/typescript-language";

export function isASTExpression(
	node: ExpressionBase,
): node is AST.Expression & ExpressionBase {
	return isExpression(node);
}

export function isASTStatement(
	node: StatementBase,
): node is AST.Statement & StatementBase {
	return isStatement(node);
}
