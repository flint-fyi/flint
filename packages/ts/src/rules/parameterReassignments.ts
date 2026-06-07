import {
	getScopeManager,
	getTSNodeRange,
	typescriptLanguage,
	type FunctionWithParameters,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Disallow reassignment of function parameters.",
		id: "parameterReassignments",
		presets: ["logical"],
	},
	messages: {
		parameterReassignment: {
			primary:
				"Reassigning function parameters can make them more difficult to reason about.",
			secondary: [
				"Most code treats function parameters as constants.",
				"Reassigning them inside the function removes that reference to the original value.",
				"It's generally more understandable to write code that does not modify parameters.",
			],
			suggestions: [
				"Use a new variable if you need to modify the value.",
				"Use a different pattern such as a helper function.",
			],
		},
	},
	setup(context) {
		function reportParameterReassignments(
			node: FunctionWithParameters,
			{ sourceFile }: TypeScriptFileServices,
		) {
			const scopeManager = getScopeManager(sourceFile);
			const parameterVariables = new Set(
				node.parameters.flatMap((parameter) =>
					scopeManager.getDeclaredVariables(parameter),
				),
			);

			for (const reference of scopeManager.getReferencesInScope(node)) {
				if (
					!reference.isWrite ||
					!reference.variable ||
					!parameterVariables.has(reference.variable)
				) {
					continue;
				}

				context.report({
					message: "parameterReassignment",
					range: getTSNodeRange(reference.identifier, sourceFile),
				});
			}
		}

		return {
			visitors: {
				ArrowFunction: reportParameterReassignments,
				Constructor: reportParameterReassignments,
				FunctionDeclaration: reportParameterReassignments,
				FunctionExpression: reportParameterReassignments,
				GetAccessor: reportParameterReassignments,
				MethodDeclaration: reportParameterReassignments,
				SetAccessor: reportParameterReassignments,
			},
		};
	},
});
