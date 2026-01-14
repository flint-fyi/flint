import ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import type { Checker } from "../index.ts";
import { typescriptLanguage } from "../language.ts";
import type * as AST from "../types/ast.ts";
import { ruleCreator } from "./ruleCreator.ts";

enum EnumMemberKind {
	Number = "number",
	String = "string",
	Unknown = "unknown",
}

function getEnumMemberKind(
	member: AST.EnumMember,
	typeChecker: Checker,
): EnumMemberKind {
	const type = typeChecker.getTypeAtLocation(member);

	if (type.isNumberLiteral() || (type.flags & ts.TypeFlags.NumberLike) !== 0) {
		return EnumMemberKind.Number;
	}

	if (type.isStringLiteral() || (type.flags & ts.TypeFlags.StringLike) !== 0) {
		return EnumMemberKind.String;
	}

	return EnumMemberKind.Unknown;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports enums that contain both string and number members.",
		id: "enumValueConsistency",
		presets: ["logical"],
	},
	messages: {
		mixedTypes: {
			primary:
				"Enum '{{ name }}' contains both number and string members, which can cause unexpected iteration behavior.",
			secondary: [
				"When iterating over a mixed enum with Object.keys(), Object.values(), or Object.entries(), numeric members will also include reverse mappings.",
				"This results in a different number of items than the actual enum members.",
				"Pure string enums don't have this issue since they don't create reverse mappings.",
			],
			suggestions: [
				"Convert all members to strings for predictable iteration.",
				"Convert all members to numbers if reverse mappings are intentional.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				EnumDeclaration: (node, { sourceFile, typeChecker }) => {
					if (node.members.length < 2) {
						return;
					}

					let hasNumber = false;
					let hasString = false;

					for (const member of node.members) {
						const kind = getEnumMemberKind(member, typeChecker);

						if (kind === EnumMemberKind.Number) {
							hasNumber = true;
						} else if (kind === EnumMemberKind.String) {
							hasString = true;
						}

						if (hasNumber && hasString) {
							const name = node.name.text;

							context.report({
								data: { name },
								message: "mixedTypes",
								range: getTSNodeRange(node.name, sourceFile),
							});
							return;
						}
					}
				},
			},
		};
	},
});
