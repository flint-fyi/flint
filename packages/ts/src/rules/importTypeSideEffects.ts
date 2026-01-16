import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts, { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports imports that use inline type qualifiers on all specifiers when a top-level type qualifier should be used instead.",
		id: "importTypeSideEffects",
		presets: ["logical"],
	},
	messages: {
		useTopLevelQualifier: {
			primary:
				"Every specifier in this import is a type, so a single top-level `import type` would be cleaner.",
			secondary: [
				"When all specifiers in an import have inline `type` qualifiers, TypeScript's `verbatimModuleSyntax` leaves behind an empty import statement.",
				"This creates an unnecessary side-effect import at runtime.",
			],
			suggestions: [
				"Replace `import { type A, type B }` with `import type { A, B }`.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				ImportDeclaration: (node, { sourceFile }) => {
					if (
						!node.importClause ||
						node.importClause.name ||
						node.importClause.phaseModifier === SyntaxKind.TypeKeyword
					) {
						return;
					}

					const namedBindings = node.importClause.namedBindings;
					if (
						!namedBindings ||
						!ts.isNamedImports(namedBindings) ||
						namedBindings.elements.length === 0 ||
						namedBindings.elements.some((element) => !element.isTypeOnly)
					) {
						return;
					}

					context.report({
						message: "useTopLevelQualifier",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});
