import { typescriptLanguage } from "@flint.fyi/typescript-language";
import type ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports duplicate types in unions and intersections.",
		id: "typeConstituentDuplicates",
		presets: ["logical"],
	},
	messages: {
		duplicateIntersection: {
			primary: "Duplicate type in intersection.",
			secondary: ["This type appears more than once in the intersection."],
			suggestions: ["Remove the duplicate type."],
		},
		duplicateUnion: {
			primary: "Duplicate type in union.",
			secondary: ["This type appears more than once in the union."],
			suggestions: ["Remove the duplicate type."],
		},
	},
	setup(context) {
		function checkDuplicates(
			types: ts.NodeArray<ts.TypeNode>,
			sourceFile: ts.SourceFile,
			messageId: "duplicateIntersection" | "duplicateUnion",
		) {
			const seen = new Map<string, ts.TypeNode>();

			for (const typeNode of types) {
				const text = typeNode.getText(sourceFile);

				if (seen.has(text)) {
					context.report({
						message: messageId,
						range: {
							begin: typeNode.getStart(sourceFile),
							end: typeNode.getEnd(),
						},
					});
				} else {
					seen.set(text, typeNode);
				}
			}
		}

		return {
			visitors: {
				IntersectionType(node, { sourceFile }) {
					checkDuplicates(node.types, sourceFile, "duplicateIntersection");
				},
				UnionType(node, { sourceFile }) {
					checkDuplicates(node.types, sourceFile, "duplicateUnion");
				},
			},
		};
	},
});
