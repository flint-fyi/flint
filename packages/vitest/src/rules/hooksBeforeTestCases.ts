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
		description: "Reports hooks before any test case.",
		id: "hooksBeforeTestCases",
		presets: ["stylisticStrict"],
	},
	messages: {
		hookBeforeTestCase: {
			primary: "This hook appears after a test case.",
			secondary: [
				"Vitest runs setup and teardown hooks for every test case in their scope, regardless of where they are declared.",
				"This repository prefers declaring hooks before any test cases so the setup a test relies on is visible above it.",
			],
			suggestions: ["Move this hook above the test cases in its scope."],
		},
	},
	setup(context) {
		const hooksContext = [false];
		return {
			visitors: {
				CallExpression(node, { sourceFile }) {
					const vitestFunction = parseVitestFunctionCall(node);

					if (!vitestFunction) {
						hooksContext.push(false);
						return;
					}

					const { name, segments, targetNode } = vitestFunction;

					const hasExemptModifier = segments.some((segment) =>
						exemptModifiers.includes(segment),
					);

					if (testCaseFunctionNamesSet.has(name) && !hasExemptModifier) {
						hooksContext[hooksContext.length - 1] = true;
					}

					if (hooksContext.at(-1) && hookFunctionNamesSet.has(name)) {
						context.report({
							message: "hookBeforeTestCase",
							range: getTSNodeRange(targetNode, sourceFile),
						});
					}

					hooksContext.push(false);
				},
				"CallExpression:exit"() {
					hooksContext.pop();
				},
			},
		};
	},
});
