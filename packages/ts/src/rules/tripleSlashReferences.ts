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
			primary: "Triple-slash reference directives are outdated.",
			secondary: [
				"ES module imports are the modern way to declare dependencies.",
				"Triple-slash references are only needed in specific legacy scenarios.",
			],
			suggestions: [
				"Use ES module imports instead.",
				"Configure tsconfig.json to include type definitions.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				SourceFile(node: AST.SourceFile, { sourceFile }) {
					for (const ref of sourceFile.referencedFiles) {
						context.report({
							message: "noTripleSlashReference",
							range: {
								begin: ref.pos,
								end: ref.end,
							},
						});
					}

					for (const ref of sourceFile.typeReferenceDirectives) {
						context.report({
							message: "noTripleSlashReference",
							range: {
								begin: ref.pos,
								end: ref.end,
							},
						});
					}

					for (const ref of sourceFile.libReferenceDirectives) {
						context.report({
							message: "noTripleSlashReference",
							range: {
								begin: ref.pos,
								end: ref.end,
							},
						});
					}
				},
			},
		};
	},
});
