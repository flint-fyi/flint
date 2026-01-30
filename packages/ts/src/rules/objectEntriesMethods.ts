import {
	type AST,
	type Checker,
	getTSNodeRange,
	isGlobalDeclarationOfName,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { isArrayOrTupleTypeAtLocation } from "./utils/isArrayOrTupleTypeAtLocation.ts";
import { skipParentheses } from "./utils/skipParentheses.ts";

function isArrowFunctionWithParams(
	node: AST.Expression,
): node is AST.ArrowFunction {
	return node.kind === SyntaxKind.ArrowFunction && node.parameters.length > 0;
}

function isEmptyObject(node: AST.Expression, typeChecker: Checker) {
	const unwrapped = skipParentheses(node);
	return (
		isEmptyObjectLiteral(unwrapped) ||
		isObjectCreateNull(unwrapped, typeChecker)
	);
}

function isEmptyObjectLiteral(node: AST.Expression) {
	return (
		node.kind === SyntaxKind.ObjectLiteralExpression &&
		node.properties.length === 0
	);
}

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function isObjectAssignPattern(
	callback: AST.ArrowFunction,
	typeChecker: Checker,
) {
	if (callback.parameters.length < 1) {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const firstParameter = callback.parameters[0]!;

	if (firstParameter.name.kind !== SyntaxKind.Identifier) {
		return false;
	}

	const accumulatorName = firstParameter.name.text;
	const body = skipParentheses(callback.body as AST.Expression);

	if (
		!isObjectMethodCall(body, "assign", typeChecker) ||
		body.arguments.length !== 2 ||
		!isGlobalDeclarationOfName(
			body.expression.expression,
			"Object",
			typeChecker,
		)
	) {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const firstArg = body.arguments[0]!;

	if (
		firstArg.kind !== SyntaxKind.Identifier ||
		firstArg.text !== accumulatorName
	) {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const secondArg = body.arguments[1]!;

	if (
		secondArg.kind !== SyntaxKind.ObjectLiteralExpression ||
		secondArg.properties.length !== 1
	) {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const property = secondArg.properties[0]!;

	return (
		property.kind === SyntaxKind.PropertyAssignment &&
		property.name.kind === SyntaxKind.ComputedPropertyName
	);
}

function isObjectCreateNull(node: AST.Expression, typeChecker: Checker) {
	if (
		!isObjectMethodCall(node, "create", typeChecker) ||
		!isGlobalDeclarationOfName(
			node.expression.expression,
			"Object",
			typeChecker,
		) ||
		node.arguments.length !== 1
	) {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const argument = node.arguments[0]!;

	return argument.kind === SyntaxKind.NullKeyword;
}

function isObjectMethodCall(
	node: AST.AnyNode,
	text: string,
	typeChecker: Checker,
): node is AST.CallExpression & { expression: AST.PropertyAccessExpression } {
	return (
		node.kind === SyntaxKind.CallExpression &&
		node.expression.kind === SyntaxKind.PropertyAccessExpression &&
		node.expression.name.kind === SyntaxKind.Identifier &&
		node.expression.name.text === text &&
		isGlobalDeclarationOfName(node.expression.expression, "Object", typeChecker)
	);
}

function isReduceCallWithEmptyObject(
	node: AST.CallExpression,
	typeChecker: Checker,
) {
	if (
		node.expression.kind !== SyntaxKind.PropertyAccessExpression ||
		node.expression.name.kind !== SyntaxKind.Identifier ||
		node.expression.name.text !== "reduce" ||
		node.questionDotToken !== undefined ||
		node.arguments.length !== 2
	) {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const initialValue = node.arguments[1]!;

	return (
		isEmptyObject(initialValue, typeChecker) &&
		isArrayOrTupleTypeAtLocation(node.expression.expression, typeChecker)
	);
}

function isSpreadAccumulatorPattern(callback: AST.ArrowFunction) {
	if (callback.parameters.length < 1) {
		return false;
	}

	const firstParam = callback.parameters[0];
	if (
		firstParam === undefined ||
		firstParam.name.kind !== SyntaxKind.Identifier
	) {
		return false;
	}

	const accumulatorName = firstParam.name.text;
	const body = skipParentheses(callback.body as AST.Expression);

	if (
		body.kind !== SyntaxKind.ObjectLiteralExpression ||
		body.properties.length !== 2
	) {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const firstProp = body.properties[0]!;

	if (
		firstProp.kind !== SyntaxKind.SpreadAssignment ||
		firstProp.expression.kind !== SyntaxKind.Identifier ||
		firstProp.expression.text !== accumulatorName
	) {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const secondProp = body.properties[1]!;

	return (
		secondProp.kind === SyntaxKind.PropertyAssignment &&
		secondProp.name.kind === SyntaxKind.ComputedPropertyName
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Prefer Object.fromEntries() over reduce patterns that build objects from key-value pairs.",
		id: "objectEntriesMethods",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		preferFromEntries: {
			primary:
				"Using reduce to build an object from key-value pairs can be replaced with Object.fromEntries().",
			secondary: [
				"Object.fromEntries() is more readable and concise for converting an iterable of key-value pairs into an object.",
				"The reduce pattern creates unnecessary intermediate objects on each iteration.",
			],
			suggestions: [
				"Convert the array to key-value pairs with map() and use Object.fromEntries().",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					if (!isReduceCallWithEmptyObject(node, typeChecker)) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const callback = node.arguments[0]!;

					if (
						!isArrowFunctionWithParams(callback) ||
						callback.body.kind === SyntaxKind.Block
					) {
						return;
					}

					if (
						!isObjectAssignPattern(callback, typeChecker) &&
						!isSpreadAccumulatorPattern(callback)
					) {
						return;
					}

					context.report({
						message: "preferFromEntries",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});
