import { type AST, typescriptLanguage } from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports triple-slash reference directives.",
		id: "tripleSlashReferences",
		presets: ["logical"],
	},
	messages: {
		noTripleSlashReference: {
			primary:
				"Prefer ECMAScript modules and/or TSConfig settings over legacy triple-slash directives.",
			secondary: [
				"ECMAScript module imports are the modern way to declare dependencies.",
				"Triple-slash references are only needed in specific legacy scenarios.",
			],
			suggestions: [
				"Use ECMAScript module imports instead.",
				"Configure tsconfig.json to include type definitions.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				SourceFile(node: AST.SourceFile) {
					for (const reference of [
						...node.referencedFiles,
						...node.typeReferenceDirectives,
						...node.libReferenceDirectives,
					]) {
						context.report({
							message: "noTripleSlashReference",
							range: {
								begin: reference.pos,
								end: reference.end,
							},
						});
					}
				},
			},
		};
	},
});
