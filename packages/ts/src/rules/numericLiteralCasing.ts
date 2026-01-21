import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

function fixBigIntLiteral(raw: string) {
	return fixNumericLiteral(raw.slice(0, -1)) + "n";
}

function fixNumericLiteral(raw: string) {
	let fixed = raw.toLowerCase();

	if (fixed.startsWith("0x")) {
		fixed = "0x" + fixed.slice(2).toUpperCase();
	}

	return fixed;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports numeric literals with inconsistent casing in prefixes and exponents.",
		id: "numericLiteralCasing",
		presets: ["stylisticStrict"],
	},
	messages: {
		invalidCasing: {
			primary:
				"Use lowercase for the `{{ prefix }}` prefix and exponent notation.",
			secondary: [
				"Lowercase prefixes (`0x`, `0o`, `0b`) and exponents (`e`) are more readable.",
				"Hexadecimal digits should be uppercase for better distinction from lowercase letters.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				BigIntLiteral: (node, { sourceFile }) => {
					const raw = node.getText(sourceFile);
					const fixed = fixBigIntLiteral(raw);

					if (raw !== fixed) {
						const prefix = getPrefix(raw);
						context.report({
							data: { prefix },
							message: "invalidCasing",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
				NumericLiteral: (node, { sourceFile }) => {
					const raw = node.getText(sourceFile);
					const fixed = fixNumericLiteral(raw);

					if (raw !== fixed) {
						const prefix = getPrefix(raw);
						context.report({
							data: { prefix },
							message: "invalidCasing",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
			},
		};
	},
});

function getPrefix(raw: string) {
	const lowerRaw = raw.toLowerCase();
	if (lowerRaw.startsWith("0x")) {
		return "0x";
	}

	if (lowerRaw.startsWith("0o")) {
		return "0o";
	}

	if (lowerRaw.startsWith("0b")) {
		return "0b";
	}

	if (lowerRaw.includes("e")) {
		return "e";
	}

	return "";
}
