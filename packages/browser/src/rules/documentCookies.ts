import {
	getTSNodeRange,
	isGlobalDeclaration,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports uses of `document.cookie` which can be error-prone and has security implications.",
		id: "documentCookies",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		noCookie: {
			primary:
				"Direct use of `document.cookie` is error-prone and has security implications.",
			secondary: [
				"Reading and writing cookies through document.cookie requires manual string parsing and formatting, which is error-prone.",
				"Cookie operations should be performed through dedicated libraries or browser APIs that handle encoding, expiration, and security properly.",
			],
			suggestions: [
				"Use a cookie management library or the modern Cookie Store API instead.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				PropertyAccessExpression(node, { sourceFile, typeChecker }) {
					if (
						node.name.kind === SyntaxKind.Identifier &&
						node.name.text === "cookie" &&
						node.expression.kind === SyntaxKind.Identifier &&
						node.expression.text === "document" &&
						isGlobalDeclaration(node.expression, typeChecker)
					) {
						context.report({
							message: "noCookie",
							range: getTSNodeRange(node.name, sourceFile),
						});
					}
				},
			},
		};
	},
});
