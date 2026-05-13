import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports numeric literals with unnecessary zero fractions or dangling dots.",
		id: "unnecessaryNumericFractions",
		presets: ["stylistic"],
	},
	messages: {
		danglingDot: {
			primary: "Prefer `{{ fixed }}` over `{{ raw }}` to avoid a dangling dot.",
			secondary: [
				"Numeric literals with dangling dots (e.g., `1.`) are harder to read and can be confusing.",
				"The dot doesn't add any precision information to the number.",
			],
			suggestions: ["Remove the dangling dot from the numeric literal."],
		},
		zeroFraction: {
			primary:
				"Prefer `{{ fixed }}` over `{{ raw }}` to avoid an unnecessary zero fraction.",
			secondary: [
				"Numeric literals with zero fractions (e.g., `1.0`) are unnecessarily verbose.",
				"The zero fraction doesn't add any precision information to the number.",
			],
			suggestions: ["Remove the zero fraction from the numeric literal."],
		},
	},
	setup(context) {
		return {
			visitors: {
				NumericLiteral: (node, { sourceFile }) => {
					const raw = node.getText(sourceFile);

					// Legacy octal numbers (0777) and prefixed numbers (0o1234, 0x123, 0b101) cannot have a dot
					const regex = /^([\d_]*)(\.[\d_]*)(?:e[+-]?\d+)?$/;
					const match = regex.exec(raw);
					if (!match) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const before = match[1]!;
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					const dotAndFractions = match[2]!;
					const after = raw.slice(before.length + dotAndFractions.length);

					// Remove trailing zeros and underscores (and dot if all zeros)
					// But keep at least one digit if there are non-zero digits
					const fixedDotAndFractions = dotAndFractions
						.replace(/[0_]+$/, "")
						.replace(/\.$/, "");
					const fixed = (before + fixedDotAndFractions || "0") + after;

					if (fixed === raw) {
						return;
					}

					context.report({
						data: {
							fixed,
							raw,
						},
						fix: {
							range: getTSNodeRange(node, sourceFile),
							text: fixed,
						},
						message: dotAndFractions === "." ? "danglingDot" : "zeroFraction",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});
