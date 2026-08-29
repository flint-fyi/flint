import { SyntaxKind } from "typescript";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports type parameters constrained to `any` or `unknown`.",
		id: "unnecessaryTypeConstraints",
		presets: ["logical"],
	},
	messages: {
		unnecessaryConstraint: {
			primary:
				"Type parameter `{{ name }}` has an unnecessary `{{ constraint }}` constraint.",
			secondary: [
				"The `{{ constraint }}` constraint does not restrict which types can be used for the type parameter.",
			],
			suggestions: ["Remove the `extends {{ constraint }}` constraint."],
		},
	},
	setup(context) {
		return {
			visitors: {
				TypeParameter(
					node: AST.TypeParameterDeclaration,
					{ sourceFile }: TypeScriptFileServices,
				) {
					if (
						node.constraint?.kind !== SyntaxKind.AnyKeyword &&
						node.constraint?.kind !== SyntaxKind.UnknownKeyword
					) {
						return;
					}

					const shouldInsertTrailingComma =
						node.parent.kind === SyntaxKind.ArrowFunction &&
						node.parent.typeParameters?.length === 1 &&
						node.default === undefined &&
						/\.(?:tsx|mts|cts)$/i.test(sourceFile.fileName) &&
						!node.parent.typeParameters.hasTrailingComma;

					context.report({
						data: {
							constraint:
								node.constraint.kind === SyntaxKind.AnyKeyword
									? "any"
									: "unknown",
							name: node.name.text,
						},
						fix: {
							range: {
								begin: node.name.getEnd(),
								end: node.constraint.getEnd(),
							},
							text: shouldInsertTrailingComma ? "," : "",
						},
						message: "unnecessaryConstraint",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});
