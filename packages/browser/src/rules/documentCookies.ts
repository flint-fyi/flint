import { isIdentifier } from "typescript-native/unstable/ast";

import {
	getTSNodeRange,
	isGlobalDeclaration,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

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
				PropertyAccessExpression(node, { checker, program, sourceFile }) {
					if (
						isIdentifier(node.name) &&
						node.name.text === "cookie" &&
						isIdentifier(node.expression) &&
						node.expression.text === "document" &&
						isGlobalDeclaration(node.expression, checker, program)
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
