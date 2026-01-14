import { typescriptLanguage } from "../language.ts";
import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports using debugger statements.",
		id: "debuggerStatements",
		presets: ["logical"],
	},
	messages: {
		noDebugger: {
			primary: "Debugger statements should not be used in production code.",
			secondary: [
				"The `debugger` statement causes the JavaScript runtime to pause execution and start a debugger if one is available, such as when browser developer tools are open.",
				"This can be useful during development, but should not be left in production code.",
			],
			suggestions: [
				"Remove the `debugger` statement before shipping this code to users.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				DebuggerStatement: (node) => {
					const range = {
						begin: node.getStart(),
						end: node.getEnd(),
					};

					context.report({
						message: "noDebugger",
						range,
						suggestions: [
							{
								id: "removeDebugger",
								range,
								text: "",
							},
						],
					});
				},
			},
		};
	},
});
