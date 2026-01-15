import {
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import type { AST } from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Enforce default parameters to be last.",
		id: "defaultParameterLast",
		presets: ["untyped"],
	},
	messages: {
		defaultParameterLast: {
			primary:
				"Default parameters should be last to allow omitting optional tail arguments.",
			secondary: [
				"Putting default parameters last allows function calls to omit optional tail arguments.",
				"Non-default parameters after default ones must always be explicitly provided.",
			],
			suggestions: [
				"Move the default parameter to the end of the parameter list.",
			],
		},
	},
	setup(context) {
		function checkNode(
			node:
				| AST.ArrowFunction
				| AST.ConstructorDeclaration
				| AST.FunctionDeclaration
				| AST.FunctionExpression
				| AST.MethodDeclaration,
			{ sourceFile }: TypeScriptFileServices,
		) {
			let hasSeenDefaultParameter = false;

			for (const parameter of node.parameters) {
				if (parameter.dotDotDotToken) {
					continue;
				}

				if (parameter.questionToken || parameter.initializer) {
					hasSeenDefaultParameter = true;
					continue;
				}

				if (hasSeenDefaultParameter) {
					context.report({
						message: "defaultParameterLast",
						range: getTSNodeRange(parameter, sourceFile),
					});
				}
			}
		}

		return {
			visitors: {
				ArrowFunction: checkNode,
				Constructor: checkNode,
				FunctionDeclaration: checkNode,
				FunctionExpression: checkNode,
				MethodDeclaration: checkNode,
			},
		};
	},
});
