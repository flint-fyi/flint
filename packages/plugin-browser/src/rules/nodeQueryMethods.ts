import {
	getTSNodeRange,
	isGlobalDeclaration,
	typescriptLanguage,
} from "@flint.fyi/ts";
import { nullThrows } from "@flint.fyi/utils";
import { SyntaxKind } from "typescript";

const legacyMethods = new Set([
	"getElementById",
	"getElementsByClassName",
	"getElementsByTagName",
	"getElementsByTagNameNS",
]);

const methodReplacements: Record<string, string> = {
	getElementById: "querySelector",
	getElementsByClassName: "querySelectorAll",
	getElementsByTagName: "querySelectorAll",
	getElementsByTagNameNS: "querySelectorAll",
};

export default typescriptLanguage.createRule({
	about: {
		description:
			"Prefer modern `querySelector` and `querySelectorAll` over legacy DOM query methods.",
		id: "nodeQueryMethods",
		preset: "stylistic",
	},
	messages: {
		preferQuerySelector: {
			primary:
				"Prefer `{{ replacement }}()` over the legacy `{{ method }}()` method.",
			secondary: [
				"The querySelector and querySelectorAll methods provide a more consistent and powerful API for querying DOM elements.",
				"They use CSS selectors which are more flexible and widely understood than the older getElementById/getElementsBy* methods.",
			],
			suggestions: [
				"Use {{ replacement }}() with an appropriate CSS selector.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression(node, { sourceFile, typeChecker }) {
					if (
						node.expression.kind === SyntaxKind.PropertyAccessExpression &&
						node.expression.name.kind === SyntaxKind.Identifier &&
						legacyMethods.has(node.expression.name.text) &&
						isGlobalDeclaration(node.expression.name, typeChecker)
					) {
						context.report({
							data: {
								method: node.expression.name.text,
								replacement: nullThrows(
									methodReplacements[node.expression.name.text],
									"Replacement is expected to be present by the has check",
								),
							},
							message: "preferQuerySelector",
							range: getTSNodeRange(node.expression.name, sourceFile),
						});
					}
				},
			},
		};
	},
});
