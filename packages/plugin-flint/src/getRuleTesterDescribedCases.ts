import type { AST } from "@flint.fyi/ts";
import { isTruthy, nullThrows } from "@flint.fyi/utils";
import { SyntaxKind } from "typescript";

import { findProperty } from "./findProperty.ts";
import { parseTestCase, parseTestCaseInvalid } from "./parseTestCases.ts";

export function getRuleTesterDescribedCases(node: AST.CallExpression) {
	if (
		node.expression.kind != SyntaxKind.PropertyAccessExpression ||
		node.expression.expression.kind != SyntaxKind.Identifier ||
		node.expression.name.kind != SyntaxKind.Identifier ||
		node.expression.name.text !== "describe" ||
		node.arguments.length !== 2
	) {
		return undefined;
	}

	// TODO: Check node.expression.expression's type for being a RuleTester
	// https://github.com/flint-fyi/flint/issues/152

	const argument = nullThrows(
		node.arguments[1],
		"Second argument is expected to be present by prior length check",
	);
	if (argument.kind != SyntaxKind.ObjectLiteralExpression) {
		return undefined;
	}

	const invalid = findProperty(
		argument.properties,
		"invalid",
		(node) => node.kind == SyntaxKind.ArrayLiteralExpression,
	);
	if (!invalid) {
		return undefined;
	}

	const valid = findProperty(
		argument.properties,
		"valid",
		(node) => node.kind == SyntaxKind.ArrayLiteralExpression,
	);
	if (!valid) {
		return undefined;
	}

	return {
		invalid: invalid.elements.map(parseTestCaseInvalid).filter(isTruthy),
		valid: valid.elements.map(parseTestCase).filter(isTruthy),
	};
}
