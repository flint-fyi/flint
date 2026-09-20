import { SyntaxKind } from "typescript-native/unstable/ast";

import {
	findTokenInRange,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Prefer interface declarations over type aliases for object types.",
		id: "objectTypeDefinitions",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		preferInterface: {
			primary:
				"Type aliases for object types have different behavior from interfaces in some cases.",
			secondary: [
				"Interfaces support declaration merging and can be extended with the `extends` keyword.",
				"Interfaces can be implemented by classes, providing clearer contracts.",
				"Error messages from the TypeScript compiler often display the interface name directly, making them more readable.",
			],
			suggestions: [
				"Use an interface declaration instead: `interface Name { ... }`.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				TypeAliasDeclaration: (node, { sourceFile }) => {
					if (node.type.kind !== SyntaxKind.TypeLiteral) {
						return;
					}

					context.report({
						message: "preferInterface",
						range:
							findTokenInRange(
								sourceFile,
								SyntaxKind.TypeKeyword,
								node.getStart(sourceFile),
								node.type.getStart(sourceFile),
							) ?? getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});
