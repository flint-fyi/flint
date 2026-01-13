import ts, { SyntaxKind } from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports enum members without explicit initial values.",
		id: "enumInitializers",
		presets: ["logical"],
	},
	messages: {
		defineInitializer: {
			primary: "Enum member '{{ name }}' should have an explicit initializer.",
			secondary: [
				"Enum members without explicit values are assigned sequentially increasing numbers.",
				"This can cause unintended value changes if enum members are reordered or removed.",
			],
			suggestions: [
				"Add an explicit value, such as `{{ name }} = {{ suggestedIndex }}`.",
				"Or use a string value: `{{ name }} = '{{ name }}'`.",
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

						const memberName = member.name;
						const name =
							memberName.kind === SyntaxKind.Identifier
								? memberName.text
								: memberName.getText(sourceFile);
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
