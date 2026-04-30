import {
	isGlobalDeclarationOfName,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as tsutils from "ts-api-utils";
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
				CallExpression(node, { sourceFile, typeChecker }) {
					if (
						ts.isPropertyAccessExpression(node.expression) &&
						node.expression.name.text === "charCodeAt" &&
						tsutils.isTypeFlagSet(
							typeChecker.getTypeAtLocation(node.expression.expression),
							ts.TypeFlags.StringLike,
						)
					) {
						context.report({
							message: "preferCodePointAt",
							range: {
								begin: node.expression.name.getStart(sourceFile),
								end: node.expression.name.getEnd(),
							},
						});
					}
				},
				PropertyAccessExpression(node, { sourceFile, typeChecker }) {
					if (
						node.name.text === "fromCharCode" &&
						ts.isIdentifier(node.expression) &&
						isGlobalDeclarationOfName(node.expression, "String", typeChecker)
					) {
						context.report({
							message: "preferFromCodePoint",
							range: {
								begin: node.name.getStart(sourceFile),
								end: node.name.getEnd(),
							},
						});
					}
				},
			},
		};
	},
});
