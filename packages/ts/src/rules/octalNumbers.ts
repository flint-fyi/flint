import { typescriptLanguage } from "@flint.fyi/typescript-language";
import { nullThrows } from "@flint.fyi/utils";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports using legacy octal numeric literals.",
		id: "octalNumbers",
		presets: ["untyped"],
	},
	messages: {
		noOctalNumber: {
			primary:
				"This legacy octal numeric literal evaluates to {{ raw }}. Did you mean that value, or to use a modern octal syntax such as {{ equivalent }}?",
			secondary: [
				"Legacy octal numeric literals (e.g., `077`, `0123`) are a deprecated feature in JavaScript that can lead to confusion and errors.",
				"They are forbidden in strict mode and are less readable than their modern alternatives.",
				"The digit `0` by itself is allowed as it represents zero, not an octal literal.",
			],
			suggestions: [
				"Use the explicit octal syntax (e.g., `0o77`) introduced in ES6, which is clearer and works in both strict and non-strict modes.",
				"Remove the leading `0` if you intended to use the decimal value.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				NumericLiteral: (node, { sourceFile }) => {
					const text = node.getText(sourceFile);

					// Check for legacy octal literal: starts with 0 followed by octal digits (0-7)
					// But not just "0" alone, and not modern formats like 0x, 0o, 0b
					// cspell:ignore xobi
					if (
						text.length > 1 &&
						text.startsWith("0") &&
						nullThrows(
							text[1],
							"Second character is expected to be present by prior length check",
						) >= "0" &&
						nullThrows(
							text[1],
							"Second character is expected to be present by prior length check",
						) <= "7" &&
						!/^0[xobi]/i.test(text)
					) {
						const range = {
							begin: node.getStart(sourceFile),
							end: node.getEnd(),
						};

						// Parse the octal value
						const octalValue = parseInt(text, 8);
						const modernOctalSyntax = `0o${text.slice(1)}`;
						const decimalWithoutLeadingZero = text.slice(1);

						context.report({
							data: {
								equivalent: modernOctalSyntax,
								raw: octalValue.toString(),
							},
							message: "noOctalNumber",
							range,
							suggestions: [
								{
									id: "useModernOctalSyntax",
									range,
									text: modernOctalSyntax,
								},
								{
									id: "removeLeadingZero",
									range,
									text: decimalWithoutLeadingZero,
								},
							],
						});
					}
				},
			},
		};
	},
});
