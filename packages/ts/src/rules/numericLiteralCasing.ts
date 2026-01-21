import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

function fixBigIntLiteral(raw: string) {
	return fixNumericLiteral(raw.slice(0, -1)) + "n";
}

function fixNumericLiteral(raw: string) {
	const fixed = raw.toLowerCase();

	return fixed.startsWith("0x") ? "0x" + fixed.slice(2).toUpperCase() : fixed;
}

function getPrefix(raw: string) {
	const lowerRaw = raw.toLowerCase();

	for (const prefix of ["0x", "0o", "0b"]) {
		if (lowerRaw.startsWith(prefix)) {
			return prefix;
		}
	}

	if (lowerRaw.includes("e")) {
		return "e";
	}

	return "";
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
			primary: "Prefer lowercase for the exponent notation.",
			secondary: [
				"Lowercase prefixes (`0x`, `0o`, `0b`) and exponents (`e`) are more readable.",
				"Hexadecimal digits should be uppercase for better distinction from lowercase letters.",
			],
			suggestions: ["Switch the numeric literal to the suggested case."],
		},
		invalidCasingPrefix: {
			primary:
				"Prefer lowercase for the `{{ prefix }}` prefix and exponent notation.",
			secondary: [
				"Lowercase prefixes (`0x`, `0o`, `0b`) and exponents (`e`) are more readable.",
				"Hexadecimal digits should be uppercase for better distinction from lowercase letters.",
			],
			suggestions: ["Switch the numeric literal to the suggested case."],
		},
	},
	setup(context) {
		function checkNode(
			node: AST.BigIntLiteral | AST.NumericLiteral,
			fixer: (raw: string) => string,
			sourceFile: AST.SourceFile,
		) {
			const raw = node.getText(sourceFile);
			const fixed = fixer(raw);

			if (raw === fixed) {
				return;
			}

			const prefix = getPrefix(raw);

			context.report({
				data: { prefix },
				message: prefix ? "invalidCasingPrefix" : "invalidCasing",
				range: getTSNodeRange(node, sourceFile),
			});
		}

		return {
			visitors: {
				BigIntLiteral: (node, { sourceFile }) => {
					checkNode(node, fixBigIntLiteral, sourceFile);
				},
				NumericLiteral: (node, { sourceFile }) => {
					checkNode(node, fixNumericLiteral, sourceFile);
				},
			},
		};
	},
});
