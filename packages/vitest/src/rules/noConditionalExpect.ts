import ts from "typescript";
import z from "zod/v4";

import {
	getScopeManager,
	getTSNodeRange,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "../ruleCreator.ts";
import {
	getTestCallExpressionsFromDeclaredVariables,
	isTestVitestFunction,
	parseVitestFunctionCall,
} from "../utils/parseVitestFunctionCall.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "disallow conditional expects",
		id: "noConditionalExpect",
	},
	messages: {
		noConditionalExpect: {
			primary: "Avoid calling `expect` inside conditional statements",
			secondary: [],
			suggestions: [],
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
				CallExpression(node, { options, sourceFile }) {
					if (isCatchCall(node)) {
						inPromiseCatch = true;
					}

					if (options.expectAssertions && inTestCase) {
						expectAssertions =
							getExpectAssertionsCount(node) ?? expectAssertions;
					}

					const vitestFunction = parseVitestFunctionCall(node);
					if (!vitestFunction) {
						return;
					}

					if (vitestFunction.name === "test") {
						inTestCase = true;
					}

					if (vitestFunction.name !== "expect") {
						return;
					}

					const range = getTSNodeRange(node, sourceFile);

					if (inTestCase && conditionalDepth > 0 && expectAssertions === 0) {
						context.report({
							message: "noConditionalExpect",
							range,
						});
					}

					if (inPromiseCatch) {
						context.report({
							message: "noConditionalExpect",
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

					if (testCallExpressions.length > 0) {
						inTestCase = true;
					}
				},
				IfStatement: increaseConditionalDepth,
				"IfStatement:exit": decreaseConditionalDepth,
				LogicalExpression: increaseConditionalDepth,
				"LogicalExpression:exit": decreaseConditionalDepth,
				SwitchStatement: increaseConditionalDepth,
				"SwitchStatement:exit": decreaseConditionalDepth,
			},
		};
	},
});

function getExpectAssertionsCount(node: ts.CallExpression): number | undefined {
	if (!ts.isPropertyAccessExpression(node.expression)) {
		return undefined;
	}
	const { expression: object, name: property } = node.expression;

	if (!ts.isIdentifier(object) || object.text !== "expect") {
		return undefined;
	}
	if (!ts.isIdentifier(property) || property.text !== "assertions") {
		return undefined;
	}
	if (node.arguments.length !== 1) {
		return undefined;
	}

	const [assertions] = node.arguments;

	if (!assertions) {
		return undefined;
	}

	if (!ts.isNumericLiteral(assertions)) {
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

// e.g. 1_000 -> 1000
function removeNumericSeparators(text: string): string {
	return text.replace(/_/g, "");
}
