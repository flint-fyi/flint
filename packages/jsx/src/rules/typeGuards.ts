import {
	isExpression,
	type ExpressionBase,
} from "typescript-native/unstable/ast";

import type { AST } from "@flint.fyi/typescript-language";

export function isASTExpression(
	node: ExpressionBase,
): node is AST.Expression & ExpressionBase {
	return isExpression(node);
}
