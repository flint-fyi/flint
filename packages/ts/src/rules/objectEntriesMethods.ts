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
	if (node.kind !== SyntaxKind.ArrowFunction) {
		return false;
	}

	return node.parameters.length > 0;
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

function isMatchingReducePattern(
	node: AST.CallExpression,
	typeChecker: Checker,
) {
	if (!isReduceCallWithEmptyObject(node, typeChecker)) {
		return false;
	}

	const callback = node.arguments[0];
	if (callback === undefined || !isArrowFunctionWithParams(callback)) {
		return false;
	}

	if (callback.body.kind === SyntaxKind.Block) {
		return false;
	}

	return (
		isObjectAssignPattern(callback, typeChecker) ||
		isSpreadAccumulatorPattern(callback)
	);
}

function isObjectAssignPattern(
	callback: AST.ArrowFunction,
	typeChecker: Checker,
) {
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

	if (body.kind !== SyntaxKind.CallExpression) {
		return false;
	}

	if (body.expression.kind !== SyntaxKind.PropertyAccessExpression) {
		return false;
	}

	if (
		body.expression.name.kind !== SyntaxKind.Identifier ||
		body.expression.name.text !== "assign"
	) {
		return false;
	}

	if (
		!isGlobalDeclarationOfName(
			body.expression.expression,
			"Object",
			typeChecker,
		)
	) {
		return false;
	}

	if (body.arguments.length !== 2) {
		return false;
	}

	const firstArg = body.arguments[0];
	if (
		firstArg === undefined ||
		firstArg.kind !== SyntaxKind.Identifier ||
		firstArg.text !== accumulatorName
	) {
		return false;
	}

	const secondArg = body.arguments[1];
	if (
		secondArg === undefined ||
		secondArg.kind !== SyntaxKind.ObjectLiteralExpression
	) {
		return false;
	}

	if (secondArg.properties.length !== 1) {
		return false;
	}

	const property = secondArg.properties[0];
	return (
		property !== undefined &&
		property.kind === SyntaxKind.PropertyAssignment &&
		property.name.kind === SyntaxKind.ComputedPropertyName
	);
}

function isObjectCreateNull(node: AST.Expression, typeChecker: Checker) {
	if (node.kind !== SyntaxKind.CallExpression) {
		return false;
	}

	if (node.expression.kind !== SyntaxKind.PropertyAccessExpression) {
		return false;
	}

	if (
		node.expression.name.kind !== SyntaxKind.Identifier ||
		node.expression.name.text !== "create"
	) {
		return false;
	}

	if (
		!isGlobalDeclarationOfName(
			node.expression.expression,
			"Object",
			typeChecker,
		)
	) {
		return false;
	}

	if (node.arguments.length !== 1) {
		return false;
	}

	const argument = node.arguments[0];
	return argument !== undefined && argument.kind === SyntaxKind.NullKeyword;
}

function isReduceCallWithEmptyObject(
	node: AST.CallExpression,
	typeChecker: Checker,
) {
	if (node.expression.kind !== SyntaxKind.PropertyAccessExpression) {
		return false;
	}

	if (
		node.expression.name.kind !== SyntaxKind.Identifier ||
		node.expression.name.text !== "reduce"
	) {
		return false;
	}

	if (node.questionDotToken !== undefined) {
		return false;
	}

	if (node.arguments.length !== 2) {
		return false;
	}

	const initialValue = node.arguments[1];
	if (initialValue === undefined || !isEmptyObject(initialValue, typeChecker)) {
		return false;
	}

	return isArrayOrTupleTypeAtLocation(node.expression.expression, typeChecker);
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

	if (body.kind !== SyntaxKind.ObjectLiteralExpression) {
		return false;
	}

	if (body.properties.length !== 2) {
		return false;
	}

	const firstProp = body.properties[0];
	if (
		firstProp === undefined ||
		firstProp.kind !== SyntaxKind.SpreadAssignment
	) {
		return false;
	}

	if (
		firstProp.expression.kind !== SyntaxKind.Identifier ||
		firstProp.expression.text !== accumulatorName
	) {
		return false;
	}

	const secondProp = body.properties[1];
	return (
		secondProp !== undefined &&
		secondProp.kind === SyntaxKind.PropertyAssignment &&
		secondProp.name.kind === SyntaxKind.ComputedPropertyName
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Prefer Object.fromEntries() over reduce patterns that build objects from key-value pairs.",
		id: "objectEntriesMethods",
		presets: ["stylistic"],
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
					if (!isMatchingReducePattern(node, typeChecker)) {
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
