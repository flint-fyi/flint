import * as ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";
import { isTypeRecursive } from "./utils/isTypeRecursive.ts";

function isArrayOrTupleType(
	type: ts.Type,
	typeChecker: ts.TypeChecker,
): boolean {
	return isTypeRecursive(
		type,
		(t) => typeChecker.isArrayType(t) || typeChecker.isTupleType(t),
	);
}

function isFindIndexWithSimpleEquality(
	node: ts.CallExpression,
	typeChecker: ts.TypeChecker,
) {
	if (!ts.isPropertyAccessExpression(node.expression)) {
		return undefined;
	}

	const methodName = node.expression.name.text;
	if (methodName !== "findIndex" && methodName !== "findLastIndex") {
		return undefined;
	}

	if (node.arguments.length !== 1) {
		return undefined;
	}

	const callback = node.arguments[0];
	if (!callback) {
		return undefined;
	}

	if (!ts.isArrowFunction(callback) && !ts.isFunctionExpression(callback)) {
		return undefined;
	}

	if (callback.parameters.length !== 1) {
		return undefined;
	}

	const param = callback.parameters[0];
	if (!param || !ts.isIdentifier(param.name)) {
		return undefined;
	}

	const paramName = param.name.text;
	const comparedValue = isSimpleStrictEqualityCheck(callback, paramName);

	if (comparedValue === undefined) {
		return undefined;
	}

	const receiverType = getConstrainedTypeAtLocation(
		node.expression.expression,
		typeChecker,
	);

	if (!isArrayOrTupleType(receiverType, typeChecker)) {
		return undefined;
	}

	return { methodName, node };
}

function isSimpleStrictEqualityCheck(
	node: ts.ArrowFunction | ts.FunctionExpression,
	paramName: string,
) {
	let body: ts.Expression | undefined;

	if (ts.isArrowFunction(node)) {
		if (ts.isBlock(node.body)) {
			if (node.body.statements.length !== 1) {
				return undefined;
			}
			const statement = node.body.statements[0];
			if (
				!statement ||
				!ts.isReturnStatement(statement) ||
				!statement.expression
			) {
				return undefined;
			}
			body = statement.expression;
		} else {
			body = node.body;
		}
	} else if (ts.isFunctionExpression(node)) {
		if (node.body.statements.length !== 1) {
			return undefined;
		}
		const statement = node.body.statements[0];
		if (
			!statement ||
			!ts.isReturnStatement(statement) ||
			!statement.expression
		) {
			return undefined;
		}
		body = statement.expression;
	}

	if (!body || !ts.isBinaryExpression(body)) {
		return undefined;
	}

	const { left, operatorToken, right } = body;

	if (operatorToken.kind !== ts.SyntaxKind.EqualsEqualsEqualsToken) {
		return undefined;
	}

	const isLeftParam = ts.isIdentifier(left) && left.text === paramName;
	const isRightParam = ts.isIdentifier(right) && right.text === paramName;

	if (isLeftParam && !isRightParam) {
		return right;
	}
	if (isRightParam && !isLeftParam) {
		return left;
	}

	return undefined;
}

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports using `.findIndex()` or `.findLastIndex()` with simple equality checks that can be replaced with `.indexOf()` or `.lastIndexOf()`.",
		id: "arrayIndexOfMethods",
		presets: ["stylistic"],
	},
	messages: {
		preferIndexOf: {
			primary:
				"Prefer `.indexOf()` over `.findIndex()` with a simple equality check.",
			secondary: [
				"`.findIndex()` is intended for more complex predicate checks.",
				"For simple equality checks, `.indexOf()` is more readable.",
			],
			suggestions: [
				"Replace `.findIndex(x => x === value)` with `.indexOf(value)`.",
			],
		},
		preferLastIndexOf: {
			primary:
				"Prefer `.lastIndexOf()` over `.findLastIndex()` with a simple equality check.",
			secondary: [
				"`.findLastIndex()` is intended for more complex predicate checks.",
				"For simple equality checks, `.lastIndexOf()` is more readable.",
			],
			suggestions: [
				"Replace `.findLastIndex(x => x === value)` with `.lastIndexOf(value)`.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					const result = isFindIndexWithSimpleEquality(node, typeChecker);
					if (result) {
						context.report({
							message:
								result.methodName === "findIndex"
									? "preferIndexOf"
									: "preferLastIndexOf",
							range: getTSNodeRange(result.node, sourceFile),
						});
					}
				},
			},
		};
	},
});
