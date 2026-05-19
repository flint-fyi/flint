import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { isGlobalDocumentReference } from "./isGlobalDocumentReference.ts";
import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports uses of `document.domain` which relaxes same-origin protections.",
		id: "documentDomains",
		presets: ["logical"],
	},
	messages: {
		noDomain: {
			primary: "The `document.domain` API relaxes same-origin protections.",
			secondary: [
				"Setting this property weakens the browser's origin boundary for the current document.",
				"Use explicit cross-origin communication when documents need to exchange data.",
			],
			suggestions: [
				"Use `window.postMessage()` or another explicit communication API.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				PropertyAccessExpression(node, { sourceFile, typeChecker }) {
					if (
						node.name.text === "domain" &&
						isGlobalDocumentReference(node.expression, typeChecker)
					) {
						context.report({
							message: "noDomain",
							range: getTSNodeRange(node.name, sourceFile),
						});
					}
				},
			},
		};
	},
});
