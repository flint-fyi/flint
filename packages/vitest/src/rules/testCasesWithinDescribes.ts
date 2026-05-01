import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "../ruleCreator.ts";
import { parseVitestFunctionCall } from "../utils/parseVitestFunctionCall.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports importing from `node:test`.",
		id: "testCasesWithinDescribes",
		presets: ["stylisticStrict"],
	},
	messages: {
		standalone: {
			primary:
				"Prefer wrapping `{{ name }}()` {{ type }}s in a `describe()` block.",
			secondary: [
				"Vitest allows declaring standalone {{ type }}: those not in a parent `describe()` block.",
				"This repository prefers adding a parent to consistently group test cases.",
			],
			suggestions: ["Add a describe() parent to this `{{ name }}`."],
		},
	},
	setup(context) {
		let insideDescribeStack = 0;

		return {
			visitors: {
				CallExpression: (node, { sourceFile }) => {
					const functionCall = parseVitestFunctionCall(node);

					switch (functionCall?.name) {
						case "afterAll":
						case "afterEach":
						case "beforeAll":
						case "beforeEach":
							if (!insideDescribeStack) {
								context.report({
									data: { name: functionCall.name, type: "hook" },
									message: "standalone",
									range: getTSNodeRange(functionCall.targetNode, sourceFile),
								});
							}
							break;

						case "describe":
						case "xdescribe":
							insideDescribeStack += 1;
							break;

						case "fit":
						case "it":
						case "test":
						case "xit":
						case "xtest":
							if (!insideDescribeStack) {
								context.report({
									data: { name: functionCall.name, type: "test" },
									message: "standalone",
									range: getTSNodeRange(functionCall.targetNode, sourceFile),
								});
							}
					}
				},
				"CallExpression:exit": (node) => {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					switch (parseVitestFunctionCall(node!)?.name) {
						case "describe":
						case "xdescribe":
							insideDescribeStack -= 1;
							break;
					}
				},
				"SourceFile:exit": () => {
					insideDescribeStack = 0;
				},
			},
		};
	},
});
