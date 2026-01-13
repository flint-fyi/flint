import ts from "typescript";

import { jsonLanguage } from "../language.ts";

const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;
const MIN_SAFE_INTEGER = Number.MIN_SAFE_INTEGER;
const MIN_NORMAL = 2.2250738585072014e-308;

function hasLoneSurrogate(text: string): boolean {
	for (let i = 0; i < text.length; i++) {
		const code = text.charCodeAt(i);

		if (code >= 0xdc00 && code <= 0xdfff) {
			return true;
		}

		if (code >= 0xd800 && code <= 0xdbff) {
			const next = text.charCodeAt(i + 1);
			if (!(next >= 0xdc00 && next <= 0xdfff)) {
				return true;
			}
			i++;
		}
	}

	return false;
}

export default jsonLanguage.createRule({
	about: {
		description: "Reports JSON values that are unsafe for data interchange.",
		id: "valueSafety",
		preset: "logical",
	},
	messages: {
		infinity: {
			primary: "This number evaluates to {{ sign }}Infinity.",
			secondary: [
				"Numbers that evaluate to Infinity can cause interoperability issues when transferred between different parsers and environments.",
				"Consider using a different representation or limiting the value to a safe range.",
			],
			suggestions: [
				"Replace with a string representation if Infinity is intentional.",
				"Use a large but finite number within the safe range.",
			],
		},
		loneSurrogate: {
			primary: "This string contains an unmatched surrogate.",
			secondary: [
				"Lone surrogates are incomplete Unicode character pairs that can cause encoding/decoding failures.",
				"Each high surrogate (U+D800 to U+DBFF) must be followed by a low surrogate (U+DC00 to U+DFFF).",
			],
			suggestions: [
				"Use properly paired surrogates to form complete Unicode characters.",
				"Remove or replace the incomplete surrogate.",
			],
		},
		subnormal: {
			primary: "This subnormal number may be handled inconsistently.",
			secondary: [
				"Subnormal numbers are very small floating point values that may be handled differently across systems.",
				"Different programming languages and platforms may round or represent these values inconsistently.",
			],
			suggestions: [
				"Use zero if the value is negligible.",
				"Scale your data to avoid subnormal ranges.",
			],
		},
		unsafeInteger: {
			primary: "This integer is outside the safe integer range.",
			secondary: [
				"Numbers outside JavaScript's safe integer range (±2^53-1) lose precision.",
				"This can lead to data corruption when the value is parsed or manipulated.",
			],
			suggestions: [
				"Use a string representation for large integers.",
				"Split the value into multiple smaller numbers.",
			],
		},
		unsafeZero: {
			primary: "This number is too small and evaluates to zero.",
			secondary: [
				"Very small numbers can underflow to zero due to precision limitations.",
				"This silent conversion can cause unexpected behavior in calculations.",
			],
			suggestions: [
				"Use zero explicitly if that's the intended value.",
				"Scale your data to avoid underflow.",
			],
		},
	},
	setup(context) {
		function checkNumericLiteral(
			node: ts.NumericLiteral,
			sourceFile: ts.SourceFile,
		) {
			const originalText = sourceFile.text.substring(
				node.getStart(sourceFile),
				node.end,
			);
			const value = Number(originalText);

			if (!Number.isFinite(value)) {
				context.report({
					data: { sign: value > 0 ? "" : "-" },
					message: "infinity",
					range: {
						begin: node.getStart(sourceFile),
						end: node.end,
					},
				});
				return;
			}

			if (value === 0 && originalText !== "0") {
				const normalized = originalText.toLowerCase().replace(/[_\s]/g, "");
				if (
					!normalized.startsWith("0e") &&
					!normalized.startsWith("-0e") &&
					!normalized.startsWith("0.0")
				) {
					context.report({
						message: "unsafeZero",
						range: {
							begin: node.getStart(sourceFile),
							end: node.end,
						},
					});
				}
				return;
			}

			if (Number.isInteger(value)) {
				if (value > MAX_SAFE_INTEGER || value < MIN_SAFE_INTEGER) {
					context.report({
						message: "unsafeInteger",
						range: {
							begin: node.getStart(sourceFile),
							end: node.end,
						},
					});
				}
				return;
			}

			if (value !== 0 && Math.abs(value) < MIN_NORMAL) {
				context.report({
					message: "subnormal",
					range: {
						begin: node.getStart(sourceFile),
						end: node.end,
					},
				});
			}
		}

		function checkStringLiteral(
			node: ts.StringLiteral,
			sourceFile: ts.SourceFile,
		) {
			if (hasLoneSurrogate(node.text)) {
				context.report({
					message: "loneSurrogate",
					range: {
						begin: node.getStart(sourceFile),
						end: node.end,
					},
				});
			}
		}

		function checkNode(node: ts.Node, sourceFile: ts.SourceFile) {
			if (ts.isNumericLiteral(node)) {
				checkNumericLiteral(node, sourceFile);
			} else if (ts.isStringLiteral(node)) {
				checkStringLiteral(node, sourceFile);
			} else {
				node.forEachChild((child) => {
					checkNode(child, sourceFile);
				});
			}
		}

		return {
			visitors: {
				ArrayLiteralExpression: (node, { sourceFile }) => {
					checkNode(node, sourceFile);
				},
				ObjectLiteralExpression: (node, { sourceFile }) => {
					checkNode(node, sourceFile);
				},
			},
		};
	},
});
