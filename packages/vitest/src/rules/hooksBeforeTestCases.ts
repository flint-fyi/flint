import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "../ruleCreator.ts";
import { parseVitestFunctionCall } from "../utils/parseVitestFunctionCall.ts";

const testCaseFunctionNamesSet = new Set([
	"bench",
	"fit",
	"it",
	"test",
	"xit",
	"xtest",
]);

const hookFunctionNamesSet = new Set([
	"afterAll",
	"afterEach",
	"beforeAll",
	"beforeEach",
]);

const exemptModifiers = ["extend", "scoped"];

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Enforces that all lifecycle hooks should come before all test cases.",
		id: "hooksBeforeTestCases",
		presets: ["stylisticStrict"],
	},
	messages: {
		hookAfterTestCase: {
			primary: "This hook appears after a test case.",
			secondary: [
				"Vitest runs setup and teardown hooks for every test case in their scope, regardless of where they are declared.",
				"This repository prefers to declare hooks before all test cases, so the setup/teardown that tests rely on is visible above them.",
			],
			suggestions: ["Move this hook above the test cases in its scope."],
		},
	},
	setup(context) {
		const testCaseSeenByScope = [false];
		return {
			visitors: {
				CallExpression(node, { sourceFile }) {
					const vitestFunction = parseVitestFunctionCall(node);

					if (!vitestFunction) {
						testCaseSeenByScope.push(false);
						return;
					}

					const { name, segments, targetNode } = vitestFunction;

					const hasExemptModifier = segments.some((segment) =>
						exemptModifiers.includes(segment),
					);

					if (testCaseFunctionNamesSet.has(name) && !hasExemptModifier) {
						testCaseSeenByScope[testCaseSeenByScope.length - 1] = true;
					}

					if (testCaseSeenByScope.at(-1) && hookFunctionNamesSet.has(name)) {
						context.report({
							message: "hookAfterTestCase",
							range: getTSNodeRange(targetNode, sourceFile),
						});
					}

					testCaseSeenByScope.push(false);
				},
				"CallExpression:exit"() {
					testCaseSeenByScope.pop();
				},
			},
		};
	},
});
