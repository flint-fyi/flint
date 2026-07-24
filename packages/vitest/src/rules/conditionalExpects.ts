import ts from "typescript";
import z from "zod/v4";

import {
	getScopeManager,
	getTSNodeRange,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";
import { nullThrows } from "@flint.fyi/utils";

import { ruleCreator } from "../ruleCreator.ts";
import {
	getTestCallExpressionsFromDeclaredVariables,
	isTestVitestFunction,
} from "../utils/parseVitestFunctionCall.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "disallow conditional expects",
		id: "conditionalExpects",
		presets: ["logical"],
	},
	messages: {
		noConditionalExpect: {
			primary: "Avoid calling `expect` inside conditional statements",
			secondary: [
				"An `expect` inside a conditional only runs when that branch is taken.",
				"If the condition is never met, the test passes without actually asserting anything.",
				"That can hide bugs by giving false confidence that the assertion ran.",
			],
			suggestions: [
				"Move this `expect` out of the conditional so it always runs.",
				"Call `expect.assertions(...)` to guarantee the expected assertions ran, then enable the `expectAssertions` option.",
			],
		},
		noPromiseCatchExpect: {
			primary: "Avoid calling `expect` inside a `.catch()` handler",
			secondary: [
				"A `.catch()` handler only runs if the promise rejects.",
				"If the promise resolves, the assertion never runs and the test passes without checking anything.",
				"Assertion failures thrown inside the handler can also be swallowed by the rest of the promise chain.",
			],
			suggestions: [
				"Assert on the rejection directly with `await expect(promise).rejects.toThrow(...)`.",
				"Call `expect.assertions(...)` to guarantee the handler actually ran.",
			],
		},
	},
	options: {
		expectAssertions: z.boolean().default(false),
	},
	setup(context) {
		let conditionalDepth = 0;
		let inTestCase = false;
		let inPromiseCatch = false;
		let expectAssertions = 0;

		const increaseConditionalDepth = () => inTestCase && conditionalDepth++;
		const decreaseConditionalDepth = () => inTestCase && conditionalDepth--;

		return {
			visitors: {
				BinaryExpression(node) {
					if (isLogicalBinaryExpression(node)) {
						increaseConditionalDepth();
					}
				},
				"BinaryExpression:exit"(node) {
					if (isLogicalBinaryExpression(node)) {
						decreaseConditionalDepth();
					}
				},
				CallExpression(node, { options, sourceFile }) {
					if (isCatchCall(node)) {
						inPromiseCatch = true;
					}

					if (options.expectAssertions && inTestCase) {
						expectAssertions =
							getExpectAssertionsCount(node) ?? expectAssertions;
					}

					if (isTestVitestFunction(node)) {
						inTestCase = true;
					}

					if (!isExpectCall(node)) {
						return;
					}

					const range = getTSNodeRange(node, sourceFile);

					if (inTestCase && conditionalDepth > 0 && expectAssertions === 0) {
						context.report({
							message: "noConditionalExpect",
							range,
						});
					} else if (inPromiseCatch) {
						context.report({
							message: "noPromiseCatchExpect",
							range,
						});
					}
				},
				"CallExpression:exit"(node) {
					if (isTestVitestFunction(node)) {
						inTestCase = false;
						expectAssertions = 0;
					}

					if (isCatchCall(node)) {
						inPromiseCatch = false;
					}
				},
				CatchClause: increaseConditionalDepth,
				"CatchClause:exit": decreaseConditionalDepth,
				ConditionalExpression: increaseConditionalDepth,
				"ConditionalExpression:exit": decreaseConditionalDepth,
				FunctionDeclaration(node, { sourceFile }) {
					const scopeManager = getScopeManager(sourceFile);
					const declaredVariables = scopeManager.getDeclaredVariables(node);
					const testCallExpressions =
						getTestCallExpressionsFromDeclaredVariables(declaredVariables);

					if (testCallExpressions.length) {
						inTestCase = true;
					}
				},
				"FunctionDeclaration:exit"() {
					inTestCase = false;
				},
				IfStatement: increaseConditionalDepth,
				"IfStatement:exit": decreaseConditionalDepth,
				SwitchStatement: increaseConditionalDepth,
				"SwitchStatement:exit": decreaseConditionalDepth,
			},
		};
	},
});

function getExpectAssertionsCount(
	node: AST.CallExpression,
): number | undefined {
	if (node.expression.kind !== ts.SyntaxKind.PropertyAccessExpression) {
		return undefined;
	}
	const { expression: object, name: property } = node.expression;

	if (object.kind !== ts.SyntaxKind.Identifier || object.text !== "expect") {
		return undefined;
	}
	if (
		property.kind !== ts.SyntaxKind.Identifier ||
		property.text !== "assertions"
	) {
		return undefined;
	}
	if (node.arguments.length !== 1) {
		return undefined;
	}

	const assertions = nullThrows(
		node.arguments[0],
		"argument count is exactly 1, so the first argument is present",
	);

	if (assertions.kind !== ts.SyntaxKind.NumericLiteral) {
		return undefined;
	}

	return Number(removeNumericSeparators(assertions.getText()));
}

function isCatchCall({ expression }: AST.CallExpression): boolean {
	if (expression.kind === ts.SyntaxKind.PropertyAccessExpression) {
		return expression.name.text === "catch";
	}
	if (expression.kind === ts.SyntaxKind.ElementAccessExpression) {
		return (
			ts.isStringLiteral(expression.argumentExpression) &&
			expression.argumentExpression.text === "catch"
		);
	}
	return false;
}

function isExpectCall({ expression }: AST.CallExpression): boolean {
	return (
		expression.kind === ts.SyntaxKind.Identifier && expression.text === "expect"
	);
}

function isLogicalBinaryExpression({
	operatorToken,
}: AST.BinaryExpression): boolean {
	return (
		operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
		operatorToken.kind === ts.SyntaxKind.BarBarToken ||
		operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken
	);
}

// e.g. 1_000 -> 1000
function removeNumericSeparators(text: string): string {
	return text.replace(/_/g, "");
}
