import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Enforces one variable per declaration statement.",
		id: "singleVariableDeclarations",
		presets: ["logical"],
	},
	messages: {
		singleVariable: {
			primary: "Split this into separate variable declarations.",
			secondary: [
				"Declaring multiple variables in one statement can reduce readability.",
			],
			suggestions: ["Use separate declaration statements for each variable."],
		},
	},
	setup(context) {
		return {
			visitors: {
				ForStatement: (node, { sourceFile }) => {
					if (
						node.initializer &&
						ts.isVariableDeclarationList(node.initializer) &&
						node.initializer.declarations.length > 1
					) {
						context.report({
							message: "singleVariable",
							range: getTSNodeRange(node.initializer, sourceFile),
						});
					}
				},
				VariableStatement: (node, { sourceFile }) => {
					if (node.declarationList.declarations.length > 1) {
						context.report({
							message: "singleVariable",
							range: getTSNodeRange(node.declarationList, sourceFile),
						});
					}
				},
			},
		};
	},
});
