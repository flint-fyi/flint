import { SyntaxKind } from "typescript";

import {
	getStaticValue,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports enum members with duplicate values.",
		id: "enumValueDuplicates",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		duplicateValue: {
			primary:
				"Enum member '{{ name }}' has a duplicate value '{{ value }}' which is already used by '{{ firstMember }}'.",
			secondary: [
				"Duplicate enum values can lead to hard-to-track bugs since different members may be indistinguishable at runtime.",
				"When accessing enum members by value, only one of the duplicate members will be returned.",
			],
			suggestions: [
				"Use a unique value for each enum member.",
				"If duplication is intentional (e.g., for aliasing), consider using a type union instead.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				EnumDeclaration: (node, { sourceFile }) => {
					const seenValues = new Map<number | string, string>();

					for (const member of node.members) {
						if (!member.initializer) {
							continue;
						}

						const value = getStaticValue(member.initializer)?.value;
						if (typeof value !== "number" && typeof value !== "string") {
							continue;
						}

						const memberName =
							member.name.kind === SyntaxKind.Identifier
								? member.name.text
								: member.name.getText(sourceFile);

						const firstMember = seenValues.get(value);
						if (firstMember === undefined) {
							seenValues.set(value, memberName);
							continue;
						}

						context.report({
							data: {
								firstMember,
								name: memberName,
								value: String(value),
							},
							message: "duplicateValue",
							range: getTSNodeRange(member, sourceFile),
						});
					}
				},
			},
		};
	},
});
