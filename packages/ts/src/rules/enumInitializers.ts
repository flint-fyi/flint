import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports enum members without explicit initial values.",
		id: "enumInitializers",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		defineInitializer: {
			primary:
				"Enum member '{{ name }}' has an implicit initializer that may change if the enum is reordered.",
			secondary: [
				"Enum members without explicit values are assigned sequentially increasing numbers.",
				"This can cause unintended value changes if enum members are reordered or removed.",
			],
			suggestions: [
				"For numeric enums, add an index-based value such as `{{ name }} = {{ suggestedIndex }}`.",
				"For string enums, add a string value such as `{{ name }} = '{{ name }}'`.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				EnumDeclaration: (node, { sourceFile }) => {
					for (const [index, member] of node.members.entries()) {
						if (member.initializer !== undefined) {
							continue;
						}

						const name =
							member.name.kind === SyntaxKind.Identifier
								? member.name.text
								: member.name.getText(sourceFile);
						const range = getTSNodeRange(member, sourceFile);

						context.report({
							data: {
								name,
								suggestedIndex: index,
							},
							message: "defineInitializer",
							range,
							suggestions: [
								{
									id: "assignIndex",
									range,
									text: `${name} = ${index}`,
								},
								{
									id: "assignIncrementedIndex",
									range,
									text: `${name} = ${index + 1}`,
								},
								{
									id: "assignStringValue",
									range,
									text: `${name} = '${name}'`,
								},
							],
						});
					}
				},
			},
		};
	},
});
