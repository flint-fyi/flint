import * as ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import type { AST, Checker } from "../index.ts";
import { typescriptLanguage } from "../language.ts";
import { isArrayOrTupleTypeAtLocation } from "./utils/isArrayOrTupleTypeAtLocation.ts";

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

function isDirectEqualityCheck(
	node: AST.ArrowFunction | AST.FunctionExpression,
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

		default:
			return undefined;
	}

	if (
		body?.kind !== ts.SyntaxKind.BinaryExpression ||
		(body.operatorToken.kind !== ts.SyntaxKind.EqualsEqualsToken &&
			body.operatorToken.kind !== ts.SyntaxKind.EqualsEqualsEqualsToken)
	) {
		return undefined;
	}

	const isLeftParam =
		ts.isIdentifier(body.left) && body.left.text === parameterName;
	const isRightParam =
		ts.isIdentifier(body.right) && body.right.text === parameterName;

	return isLeftParam !== isRightParam;
}

function isSomeWithSimpleEquality(
	node: AST.CallExpression,
	typeChecker: Checker,
) {
	// TODO: Use a util like getStaticValue
	// https://github.com/flint-fyi/flint/issues/1298
	if (
		!ts.isPropertyAccessExpression(node.expression) ||
		node.expression.name.text !== "some" ||
		node.arguments.length !== 1
	) {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const callback = node.arguments[0]!;

	if (
		(!ts.isArrowFunction(callback) && !ts.isFunctionExpression(callback)) ||
		callback.parameters.length !== 1
	) {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const firstParameter = callback.parameters[0]!;

	return (
		ts.isIdentifier(firstParameter.name) &&
		isDirectEqualityCheck(callback, firstParameter.name.text) &&
		isArrayOrTupleTypeAtLocation(node.expression.expression, typeChecker)
	);
}

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports using `Array#some()` with simple equality checks that can be replaced with `.includes()`.",
		id: "arrayIncludesMethods",
		presets: ["stylistic"],
	},
	messages: {
		preferIncludes: {
			primary:
				"Prefer `.includes()` over `.some()` with a simple equality check.",
			secondary: [
				"`Array.prototype.some()` is intended for more complex predicate checks.",
				"For simple equality checks, `.includes()` is more readable and expressive.",
			],
			suggestions: [
				"Replace `.some(x => x === value)` with `.includes(value)`.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					if (isSomeWithSimpleEquality(node, typeChecker)) {
						context.report({
							message: "preferIncludes",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
			},
		};
	},
});
