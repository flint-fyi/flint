import { typescriptLanguage } from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports usage of charCodeAt and fromCharCode instead of their codePoint equivalents.",
		id: "stringCodePoints",
		presets: ["logical"],
	},
	messages: {
		preferCodePointAt: {
			primary:
				"Prefer `codePointAt` over `charCodeAt` for proper Unicode support.",
			secondary: [
				"charCodeAt only handles characters in the Basic Multilingual Plane (BMP).",
				"codePointAt correctly handles all Unicode code points, including emoji.",
			],
			suggestions: ["Replace with codePointAt()."],
		},
		preferFromCodePoint: {
			primary:
				"Prefer `String.fromCodePoint` over `String.fromCharCode` for proper Unicode support.",
			secondary: [
				"fromCharCode only handles code points up to U+FFFF.",
				"fromCodePoint correctly handles all Unicode code points.",
			],
			suggestions: ["Replace with String.fromCodePoint()."],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression(node, { sourceFile }) {
					if (!ts.isPropertyAccessExpression(node.expression)) {
						return;
					}

					const methodName = node.expression.name.text;
					if (methodName !== "charCodeAt") {
						return;
					}

					context.report({
						message: "preferCodePointAt",
						range: {
							begin: node.expression.name.getStart(sourceFile),
							end: node.expression.name.getEnd(),
						},
					});
				},
				PropertyAccessExpression(node, { sourceFile }) {
					if (node.name.text !== "fromCharCode") {
						return;
					}

					if (!ts.isIdentifier(node.expression)) {
						return;
					}

					if (node.expression.text !== "String") {
						return;
					}

					context.report({
						message: "preferFromCodePoint",
						range: {
							begin: node.name.getStart(sourceFile),
							end: node.name.getEnd(),
						},
					});
				},
			},
		};
	},
});
