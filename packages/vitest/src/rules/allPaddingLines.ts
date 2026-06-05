import {
	createStatementPaddingRule,
	getStatementRootName,
} from "../createStatementPaddingRule.ts";

const statementMatches = new Map([
	["afterAll", { blockName: "afterAll", category: "afterAll" }],
	["afterEach", { blockName: "afterEach", category: "afterEach" }],
	["beforeAll", { blockName: "beforeAll", category: "beforeAll" }],
	["beforeEach", { blockName: "beforeEach", category: "beforeEach" }],
	["describe", { blockName: "describe", category: "describe" }],
	["expect", { blockName: "expect", category: "expect" }],
	["expectTypeOf", { blockName: "expect", category: "expectTypeOf" }],
	["fdescribe", { blockName: "describe", category: "describe" }],
	["fit", { blockName: "test", category: "testCase" }],
	["it", { blockName: "test", category: "testCase" }],
	["test", { blockName: "test", category: "testCase" }],
	["xdescribe", { blockName: "describe", category: "describe" }],
	["xit", { blockName: "test", category: "testCase" }],
	["xtest", { blockName: "test", category: "testCase" }],
]);

export default createStatementPaddingRule(
	{
		description: "Enforces padding around Vitest blocks.",
		id: "allPaddingLines",
		presets: [],
	},
	(statement) => {
		const rootName = getStatementRootName(statement);
		if (!rootName) {
			return undefined;
		}

		return statementMatches.get(rootName);
	},
	(previousMatch, nextMatch) => {
		if (!previousMatch && !nextMatch) {
			return false;
		}

		if (
			previousMatch?.category === nextMatch?.category &&
			(previousMatch?.category === "expect" ||
				previousMatch?.category === "expectTypeOf")
		) {
			return false;
		}

		return true;
	},
);
