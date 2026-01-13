import * as ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import type { AST, Checker } from "../index.ts";
import { typescriptLanguage } from "../language.ts";
import { isArrayOrTupleTypeAtLocation } from "./utils/isArrayOrTupleTypeAtLocation.ts";
import { skipParentheses } from "./utils/skipParentheses.ts";

function isConcatApply(node: AST.CallExpression, typeChecker: Checker) {
	if (
		!ts.isPropertyAccessExpression(node.expression) ||
		node.expression.name.text !== "apply"
	) {
		return false;
	}

	const callExpression = node.expression.expression;
	if (
		!ts.isPropertyAccessExpression(callExpression) ||
		callExpression.name.text !== "concat"
	) {
		return false;
	}

	const concatObject = callExpression.expression;

	const isEmptyArrayConcat = isEmptyArrayLiteral(concatObject);
	const isArrayPrototypeConcat =
		ts.isPropertyAccessExpression(concatObject) &&
		ts.isIdentifier(concatObject.expression) &&
		concatObject.expression.text === "Array" &&
		concatObject.name.text === "prototype";

	if (
		(!isEmptyArrayConcat && !isArrayPrototypeConcat) ||
		node.arguments.length !== 2
	) {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const firstArg = node.arguments[0]!;

	if (!isEmptyArrayLiteral(firstArg)) {
		return false;
	}

	const secondArg = node.arguments[1];
	if (!secondArg) {
		return false;
	}

	return isArrayOrTupleTypeAtLocation(secondArg, typeChecker);
}

function isConcatCall(node: AST.CallExpression, typeChecker: Checker) {
	if (
		!ts.isPropertyAccessExpression(node.expression) ||
		node.expression.name.text !== "call"
	) {
		return false;
	}

	const callExpression = node.expression.expression;
	if (
		!ts.isPropertyAccessExpression(callExpression) ||
		callExpression.name.text !== "concat"
	) {
		return false;
	}

	const concatObject = callExpression.expression;
	if (
		!ts.isPropertyAccessExpression(concatObject) ||
		!ts.isIdentifier(concatObject.expression) ||
		concatObject.expression.text !== "Array" ||
		concatObject.name.text !== "prototype"
	) {
		return false;
	}

	if (node.arguments.length !== 2) {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const firstArg = node.arguments[0]!;
	if (!isEmptyArrayLiteral(firstArg)) {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const secondArg = node.arguments[1]!;
	if (!ts.isSpreadElement(secondArg)) {
		return false;
	}

	return isArrayOrTupleTypeAtLocation(secondArg.expression, typeChecker);
}

function isConcatSpread(node: AST.CallExpression, typeChecker: Checker) {
	if (
		!ts.isPropertyAccessExpression(node.expression) ||
		node.expression.name.text !== "concat"
	) {
		return false;
	}

	const object = node.expression.expression;
	if (!isEmptyArrayLiteral(object)) {
		return false;
	}

	if (node.arguments.length !== 1) {
		return false;
	}

	const arg = node.arguments[0];
	if (!arg || !ts.isSpreadElement(arg)) {
		return false;
	}

	return isArrayOrTupleTypeAtLocation(arg.expression, typeChecker);
}

function isEmptyArrayLiteral(node: AST.Expression) {
	return ts.isArrayLiteralExpression(node) && node.elements.length === 0;
}

function isIdentityArrowFunction(node: AST.Expression) {
	const expression = skipParentheses(node);

	if (!ts.isArrowFunction(expression) || expression.parameters.length !== 1) {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const param = expression.parameters[0]!;

	if (!ts.isIdentifier(param.name)) {
		return false;
	}

	const body = skipParentheses(expression.body as AST.Expression);
	return (
		body.kind === ts.SyntaxKind.Identifier && body.text === param.name.text
	);
}

function isIdentityFlatMapCall(node: AST.CallExpression, typeChecker: Checker) {
	if (
		!ts.isPropertyAccessExpression(node.expression) ||
		node.expression.name.text !== "flatMap" ||
		node.arguments.length !== 1
	) {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const arg = node.arguments[0]!;

	if (!isIdentityArrowFunction(arg)) {
		return false;
	}

	return isArrayOrTupleTypeAtLocation(node.expression.expression, typeChecker);
}

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports legacy techniques to flatten arrays instead of using `.flat()`.",
		id: "arrayFlatMethods",
		presets: ["stylistic"],
	},
	messages: {
		preferFlat: {
			primary: "Prefer `.flat()` over legacy array flattening techniques.",
			secondary: [
				"ES2019 introduced `Array.prototype.flat()` as the standard way to flatten arrays.",
				"Using modern array methods improves code readability and consistency.",
			],
			suggestions: ["Replace this with `.flat()`."],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					if (
						isIdentityFlatMapCall(node, typeChecker) ||
						isConcatSpread(node, typeChecker) ||
						isConcatApply(node, typeChecker) ||
						isConcatCall(node, typeChecker)
					) {
						context.report({
							message: "preferFlat",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
			},
		};
	},
});
