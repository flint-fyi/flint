import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function getLiteralValue(
	initializer: AST.Expression,
): number | string | undefined {
	switch (initializer.kind) {
		case SyntaxKind.NoSubstitutionTemplateLiteral:
		case SyntaxKind.StringLiteral:
			return initializer.text;

		case SyntaxKind.NumericLiteral:
			return Number(initializer.text);

		case SyntaxKind.PrefixUnaryExpression: {
			if (initializer.operand.kind !== SyntaxKind.NumericLiteral) {
				return undefined;
			}

			const value = Number(initializer.operand.text);
			if (initializer.operator === SyntaxKind.MinusToken) {
				return -value;
			}
			if (initializer.operator === SyntaxKind.PlusToken) {
				return value;
			}

			return undefined;
		}

		default:
			return undefined;
	}
}

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

						const value = getLiteralValue(member.initializer);
						if (value === undefined) {
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
