import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

const groupLength = 3;
const minimumDigits = 5;

function addSeparator(value: string, fromLeft?: boolean) {
	return value.length < minimumDigits
		? value
		: addSeparatorAlways(value, fromLeft);
}

function addSeparatorAlways(value: string, fromLeft?: boolean) {
	const { length } = value;
	const parts: string[] = [];

	if (fromLeft) {
		for (let start = 0; start < length; start += groupLength) {
			const end = Math.min(start + groupLength, length);
			parts.push(value.slice(start, end));
		}
	} else {
		for (let end = length; end > 0; end -= groupLength) {
			const start = Math.max(end - groupLength, 0);
			parts.unshift(value.slice(start, end));
		}
	}

	return parts.join("_");
}

function format(stripped: string, hasSeparators: boolean) {
	const { mark, number, power, sign } = parseNumber(stripped);
	return (
		formatNumber(number, hasSeparators) +
		mark +
		sign +
		(hasSeparators ? addSeparatorAlways(power) : addSeparator(power))
	);
}

function formatNumber(value: string, hasSeparators: boolean) {
	const { dot, fractional, integer } = parseFloatNumber(value);

	const [prefix, suffix] = hasSeparators
		? [addSeparatorAlways(integer), addSeparatorAlways(fractional, true)]
		: [addSeparator(integer), addSeparator(fractional, true)];

	return prefix + dot + suffix;
}

function parseFloatNumber(value: string) {
	const dotIndex = value.indexOf(".");
	if (dotIndex === -1) {
		return { dot: "", fractional: "", integer: value };
	}

	return {
		dot: ".",
		fractional: value.slice(dotIndex + 1),
		integer: value.slice(0, dotIndex),
	};
}

function parseNumber(value: string) {
	const match = /^([+-]?(?:\d+(?:\.\d+)?|\.\d+))(e)([+-]?)(\d+)$/i.exec(value);
	if (match) {
		return {
			/* eslint-disable @typescript-eslint/no-non-null-assertion */
			mark: match[2]!.toLowerCase(),
			number: match[1]!,
			power: match[4]!,
			sign: match[3] ?? "",
			/* eslint-enable @typescript-eslint/no-non-null-assertion */
		};
	}

	return { mark: "", number: value, power: "", sign: "" };
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports numeric literals with inconsistent separator grouping.",
		id: "numericSeparatorGroups",
		presets: ["stylisticStrict"],
	},
	messages: {
		invalidGrouping: {
			primary: "Use consistent grouping with numeric separators.",
			secondary: [
				"Numeric separators should group digits consistently for readability.",
				"Use groups of 3 for decimals, 4 for binary/octal, and 2 for hexadecimal.",
			],
			suggestions: [
				"Add `_`s to the number to make it consistent with the rest of the codebase.",
			],
		},
	},
	setup(context) {
		function checkNode(
			node: AST.BigIntLiteral | AST.NumericLiteral,
			raw: string,
			number: string,
			suffix: string,
			sourceFile: AST.SourceFile,
		) {
			if (/[a-z]/i.test(number.slice(0, 2)) || number.includes("e")) {
				return;
			}

			const stripped = number.replaceAll("_", "");
			const hasSeparators = number !== stripped;
			const formatted = format(stripped, hasSeparators) + suffix;

			if (raw === formatted) {
				return;
			}

			const range = getTSNodeRange(node, sourceFile);

			context.report({
				fix: { range, text: formatted },
				message: "invalidGrouping",
				range,
			});
		}
		return {
			visitors: {
				BigIntLiteral: (node, { sourceFile }) => {
					const raw = node.getText(sourceFile);
					const number = raw.slice(0, -1);
					checkNode(node, raw, number, "n", sourceFile);
				},
				NumericLiteral: (node, { sourceFile }) => {
					const raw = node.getText(sourceFile);
					checkNode(node, raw, raw, "", sourceFile);
				},
			},
		};
	},
});
