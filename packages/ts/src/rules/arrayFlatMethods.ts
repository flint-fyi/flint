import { SyntaxKind } from "typescript-native/unstable/ast";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type Checker,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { isArrayOrTupleTypeAtLocation } from "./utils/isArrayOrTupleTypeAtLocation.ts";
import { skipParentheses } from "./utils/skipParentheses.ts";

function isConcatApply(node: AST.CallExpression, typeChecker: Checker) {
	if (
		node.expression.kind !== SyntaxKind.PropertyAccessExpression ||
		node.expression.name.text !== "apply"
	) {
		return false;
	}

	const callExpression = node.expression.expression;
	if (
		callExpression.kind !== SyntaxKind.PropertyAccessExpression ||
		callExpression.name.text !== "concat"
	) {
		return false;
	}

	const concatObject = callExpression.expression;

	const isEmptyArrayConcat = isEmptyArrayLiteral(concatObject);
	const isArrayPrototypeConcat =
		concatObject.kind === SyntaxKind.PropertyAccessExpression &&
		concatObject.expression.kind === SyntaxKind.Identifier &&
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
		node.expression.kind !== SyntaxKind.PropertyAccessExpression ||
		node.expression.name.text !== "call"
	) {
		return false;
	}

	const callExpression = node.expression.expression;
	if (
		callExpression.kind !== SyntaxKind.PropertyAccessExpression ||
		callExpression.name.text !== "concat"
	) {
		return false;
	}

	const concatObject = callExpression.expression;
	if (
		concatObject.kind !== SyntaxKind.PropertyAccessExpression ||
		concatObject.expression.kind !== SyntaxKind.Identifier ||
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
	if (secondArg.kind !== SyntaxKind.SpreadElement) {
		return false;
	}

	return isArrayOrTupleTypeAtLocation(secondArg.expression, typeChecker);
}

function isConcatSpread(node: AST.CallExpression, typeChecker: Checker) {
	if (
		node.expression.kind !== SyntaxKind.PropertyAccessExpression ||
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
	if (arg?.kind !== SyntaxKind.SpreadElement) {
		return false;
	}

	return isArrayOrTupleTypeAtLocation(arg.expression, typeChecker);
}

function isEmptyArrayLiteral(node: AST.Expression) {
	return (
		node.kind === SyntaxKind.ArrayLiteralExpression && !node.elements.length
	);
}

function isIdentityArrowFunction(node: AST.Expression) {
	const expression = skipParentheses(node);

	if (
		expression.kind !== SyntaxKind.ArrowFunction ||
		expression.parameters.length !== 1
	) {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const param = expression.parameters[0]!;

	if (param.name.kind !== SyntaxKind.Identifier) {
		return false;
	}

	const body = skipParentheses(expression.body as AST.Expression);
	return body.kind === SyntaxKind.Identifier && body.text === param.name.text;
}

function isIdentityFlatMapCall(node: AST.CallExpression, typeChecker: Checker) {
	if (
		node.expression.kind !== SyntaxKind.PropertyAccessExpression ||
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

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports legacy techniques to flatten arrays instead of using `.flat()`.",
		id: "arrayFlatMethods",
		presets: ["stylistic", "stylisticStrict"],
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
				CallExpression: (node, { typeChecker, sourceFile }) => {
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
