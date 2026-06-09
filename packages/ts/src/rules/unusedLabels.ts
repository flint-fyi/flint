import ts from "typescript";

import { typescriptLanguage } from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports labels that are declared but never used.",
		id: "unusedLabels",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		unusedLabel: {
			primary: "Remove the unused label '{{ labelName }}'.",
			secondary: [
				"Labels in JavaScript and TypeScript are used to identify loops or blocks, allowing break and continue statements to reference them.",
				"If a label is declared but never referenced, it serves no purpose and should be removed to keep the code clean.",
			],
			suggestions: [
				"Remove the unused label to simplify the code.",
				"Add a break or continue statement that references this label if it was intended to be used.",
			],
		},
	},
	setup(context) {
		// Stack of label-usage entries, one per nesting level of LabeledStatement.
		const labelStack: { node: ts.LabeledStatement; used: boolean }[] = [];

		// Innermost-first: a break/continue targets the nearest enclosing label,
		// which matters when a name is shadowed across a function boundary.
		function markUsed(labelName: string) {
			const entry = labelStack.findLast(
				(candidate) => candidate.node.label.text === labelName,
			);
			if (entry) {
				entry.used = true;
			}
		}

		return {
			visitors: {
				BreakStatement: (node) => {
					if (node.label != null) {
						markUsed(node.label.text);
					}
				},
				ContinueStatement: (node) => {
					if (node.label != null) {
						markUsed(node.label.text);
					}
				},
				LabeledStatement: (node) => {
					labelStack.push({ node, used: false });
				},
				"LabeledStatement:exit": (_node, { sourceFile }) => {
					const entry = labelStack.pop();

					if (entry != null && !entry.used) {
						context.report({
							data: {
								labelName: entry.node.label.text,
							},
							message: "unusedLabel",
							range: {
								begin: entry.node.label.getStart(sourceFile),
								end: entry.node.label.getEnd(),
							},
						});
					}
				},
			},
		};
	},
});
