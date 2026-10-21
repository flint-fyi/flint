import {
	createStatementPaddingRule,
	parseStatementVitestFunctionCall,
} from "../createStatementPaddingRule.ts";

export default createStatementPaddingRule(
	{
		description: "Enforces padding around Vitest blocks.",
		id: "allPaddingLines",
		presets: [],
	},
	(statement) => {
		const call = parseStatementVitestFunctionCall(statement);
		if (!call) {
			return;
		}

		switch (call.kind) {
			case "describe":
				return { blockName: "describe", category: "describe" };

			case "expect":
				return { blockName: "expect", category: call.name };

			case "hook":
				return { blockName: call.name, category: call.name };

			case "test":
				return { blockName: "test", category: "testCase" };
		}
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
