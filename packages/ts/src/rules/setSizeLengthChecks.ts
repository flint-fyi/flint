import {
	isArrayLiteralExpression,
	isIdentifier,
	isNewExpression,
	isParenthesizedExpression,
	isSpreadElement,
	isVariableDeclaration,
	NodeFlags,
	SyntaxKind,
	type Program,
} from "typescript";

import {
	getTSNodeRange,
	isGlobalDeclarationOfName,
	typescriptLanguage,
	type AST,
	type Checker,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

function isNewSetExpression(
	expression: AST.Expression,
	typeChecker: Checker,
	program: Program,
) {
	return (
		isNewExpression(expression) &&
		isIdentifier(expression.expression) &&
		expression.expression.text === "Set" &&
		isGlobalDeclarationOfName(
			expression.expression,
			"Set",
			typeChecker,
			program,
		)
	);
}

function isSetExpression(
	expression: AST.Expression,
	typeChecker: Checker,
	program: Program,
) {
	const unwrapped = unwrapParentheses(expression);

	if (isNewSetExpression(unwrapped, typeChecker, program)) {
		return true;
	}

	if (!isIdentifier(unwrapped)) {
		return false;
	}

	const symbol = typeChecker.getSymbolAtLocation(unwrapped);
	if (
		!symbol?.valueDeclaration ||
		!isVariableDeclaration(symbol.valueDeclaration)
	) {
		return false;
	}

	const declaration = symbol.valueDeclaration as AST.VariableDeclaration;

	if (
		declaration.parent.kind !== SyntaxKind.VariableDeclarationList ||
		!(declaration.parent.flags & NodeFlags.Const) ||
		!declaration.initializer
	) {
		return false;
	}

	return isNewSetExpression(
		unwrapParentheses(declaration.initializer),
		typeChecker,
		program,
	);
}

function unwrapParentheses(expression: AST.Expression): AST.Expression {
	while (isParenthesizedExpression(expression)) {
		expression = expression.expression;
	}
	return expression;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Prefer `Set.size` over spreading into an array and accessing `.length`.",
		id: "setSizeLengthChecks",
		presets: ["logical"],
	},
	messages: {
		preferSize: {
			primary:
				"Prefer `Set.size` instead of spreading into an array and accessing `.length`.",
			secondary: [
				"`Set` has a built-in `.size` property that directly returns the number of elements.",
				"It is faster and more idiomatic to use that instead of creating an intermediate array.",
			],
			suggestions: ["Use `.size` directly on the `Set` instead."],
		},
	},
	setup(context) {
		return {
			visitors: {
				PropertyAccessExpression: (
					node,
					{ program, sourceFile, typeChecker },
				) => {
					if (
						node.questionDotToken ||
						node.name.text !== "length" ||
						!isArrayLiteralExpression(node.expression) ||
						node.expression.elements.length !== 1
					) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const element = node.expression.elements[0]!;

					if (
						!isSpreadElement(element) ||
						!isSetExpression(element.expression, typeChecker, program)
					) {
						return;
					}

					context.report({
						message: "preferSize",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});
