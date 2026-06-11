import ts from "typescript";

import { typescriptLanguage } from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports unnecessary constraints on generic type parameters.",
		id: "unnecessaryTypeConstraints",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		unnecessaryConstraint: {
			primary:
				"Constraining the generic type `{{ name }}` to `{{ constraint }}` does nothing and is unnecessary.",
			secondary: [
				"Generic type parameters are implicitly constrained to `unknown`, and every type is assignable to both `any` and `unknown`.",
			],
			suggestions: ["Remove the constraint."],
		},
	},
	setup(context) {
		return {
			visitors: {
				TypeParameter: (node, { sourceFile }) => {
					if (
						!node.constraint ||
						(node.constraint.kind !== ts.SyntaxKind.AnyKeyword &&
							node.constraint.kind !== ts.SyntaxKind.UnknownKeyword)
					) {
						return;
					}

					context.report({
						data: {
							constraint: node.constraint.getText(sourceFile),
							name: node.name.text,
						},
						message: "unnecessaryConstraint",
						range: {
							begin: node.name.getEnd(),
							end: node.constraint.getEnd(),
						},
					});
				},
			},
		};
	},
});
