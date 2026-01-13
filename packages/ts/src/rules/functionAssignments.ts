import { typescriptLanguage } from "../language.ts";
import { getModifyingReferences } from "../utils/getModifyingReferences.ts";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports reassigning variables declared with function declarations.",
		id: "functionAssignments",
		preset: "untyped",
	},
	messages: {
		noFunctionAssignment: {
			primary:
				"Variables declared with function declarations should not be reassigned.",
			secondary: [
				"Reassigning a function declaration can make code harder to understand and maintain.",
				"Function declarations are hoisted to the top of their scope, and reassigning them can lead to unexpected behavior.",
			],
			suggestions: [
				"Use a function expression or const variable instead if you need to reassign the function.",
			],
		},
	},

	setup(context) {
		return {
			visitors: {
				FunctionDeclaration: (node, { sourceFile, typeChecker }) => {
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
							message: "noFunctionAssignment",
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
