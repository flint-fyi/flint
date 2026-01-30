import {
	getTSNodeRange,
	isGlobalDeclarationOfName,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports uses of the eval function.",
		id: "evals",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		noEval: {
			primary:
				"Avoid using `eval()` as it poses security and performance risks.",
			secondary: [
				"`eval()` executes arbitrary code, which can be exploited for code injection attacks.",
				"It prevents JavaScript engine optimizations, making code run slower.",
				"It makes code harder to debug and reason about.",
			],
			suggestions: [
				"Use safer alternatives like `JSON.parse()` for parsing JSON data.",
				"Use `Function` constructor if dynamic code execution is truly necessary (though still risky).",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					if (isGlobalDeclarationOfName(node.expression, "eval", typeChecker)) {
						context.report({
							message: "noEval",
							range: getTSNodeRange(node.expression, sourceFile),
						});
					}
				},
			},
		};
	},
});
