import { typescriptLanguage } from "../language.ts";
import { getModifyingReferences } from "../utils/getModifyingReferences.ts";
import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports reassigning class declarations.",
		id: "classAssignments",
		presets: ["untyped"],
	},
	messages: {
		noClassAssign: {
			primary:
				"Reassigning a class declaration is misleading and makes the class harder to use.",
			secondary: [
				"Reassigning a class declaration can lead to unexpected behavior and makes code harder to understand.",
				"Class declarations are typically intended to be immutable references, and reassigning them can cause confusion about which class is being used.",
			],
			suggestions: [
				"Use a different variable name if you need to store a modified reference to a class.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				ClassDeclaration: (node, { sourceFile, typeChecker }) => {
					if (!node.name) {
						return;
					}

					const modifyingReferences = getModifyingReferences(
						node.name,
						sourceFile,
						typeChecker,
					);

					for (const reference of modifyingReferences) {
						context.report({
							message: "noClassAssign",
							range: {
								begin: reference.getStart(sourceFile),
								end: reference.getEnd(),
							},
						});
					}
				},
			},
		};
	},
});
