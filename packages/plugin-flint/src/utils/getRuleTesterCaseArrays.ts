import {
	isArrayLiteralExpression,
	isIdentifier,
	isObjectLiteralExpression,
	isPropertyAccessExpression,
} from "typescript-native/unstable/ast";

import type { AST } from "@flint.fyi/typescript-language";

import { findProperty } from "./findProperty.ts";

export interface RuleTesterCases {
	invalid: AST.ArrayLiteralExpression;
	valid: AST.ArrayLiteralExpression;
}

export function getRuleTesterCaseArrays(
	node: AST.CallExpression,
): RuleTesterCases | undefined {
	if (
		!isPropertyAccessExpression(node.expression) ||
		!isIdentifier(node.expression.expression) ||
		!isIdentifier(node.expression.name) ||
		node.expression.name.text !== "describe" ||
		node.arguments.length !== 2
	) {
		return;
	}

	// TODO: Check node.expression.expression's type for being a RuleTester
	// https://github.com/flint-fyi/flint/issues/152

	const argument = node.arguments[1];
	if (!argument || !isObjectLiteralExpression(argument)) {
		return;
	}

	const valid = findProperty(
		argument.properties,
		"valid",
		(node): node is AST.ArrayLiteralExpression =>
			isArrayLiteralExpression(node),
	);

	const invalid = findProperty(
		argument.properties,
		"invalid",
		(node): node is AST.ArrayLiteralExpression =>
			isArrayLiteralExpression(node),
	);

	if (!valid || !invalid) {
		return;
	}

	return { invalid, valid };
}
