import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

interface GroupOptions {
	groupLength: number;
	minimumDigits: number;
}

const defaultOptions = {
	"": { groupLength: 3, minimumDigits: 5 },
	"0b": { groupLength: 4, minimumDigits: 0 },
	"0o": { groupLength: 4, minimumDigits: 0 },
	"0x": { groupLength: 2, minimumDigits: 0 },
};

function addSeparator(
	value: string,
	{ groupLength, minimumDigits }: GroupOptions,
	fromLeft = false,
) {
	const { length } = value;
	if (length < minimumDigits) {
		return value;
	}

	return addSeparatorAlways(value, groupLength, fromLeft);
}

function addSeparatorAlways(
	value: string,
	groupLength: number,
	fromLeft = false,
) {
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

function format(
	stripped: string,
	prefix: string,
	data: string,
	hasSeparators: boolean,
) {
	const formatOption =
		defaultOptions[prefix.toLowerCase() as keyof typeof defaultOptions];

	if (prefix) {
		if (hasSeparators) {
			return prefix + addSeparatorAlways(data, formatOption.groupLength);
		}

		return prefix + addSeparator(data, formatOption);
	}

	const { mark, number, power, sign } = parseNumber(stripped);
	return (
		formatNumber(number, formatOption, hasSeparators) +
		mark +
		sign +
		(hasSeparators
			? addSeparatorAlways(power, defaultOptions[""].groupLength)
			: addSeparator(power, defaultOptions[""]))
	);
}

function formatNumber(
	value: string,
	options: GroupOptions,
	hasSeparators: boolean,
) {
	const { dot, fractional, integer } = parseFloatNumber(value);

	if (hasSeparators) {
		return (
			addSeparatorAlways(integer, options.groupLength) +
			dot +
			addSeparatorAlways(fractional, options.groupLength, true)
		);
	}

	return (
		addSeparator(integer, options) +
		dot +
		addSeparator(fractional, options, true)
	);
}

function getPrefix(raw: string) {
	const lowerRaw = raw.toLowerCase();

	for (const prefix of ["0x", "0o", "0b"]) {
		if (lowerRaw.startsWith(prefix)) {
			return { data: raw.slice(2), prefix };
		}
	}

	return { data: raw, prefix: "" };
}

function isLegacyOctal(raw: string) {
	return /^0[0-7]+$/.test(raw);
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
			if (isLegacyOctal(number)) {
				return;
			}

			const hasSeparators = raw.includes("_");
			const stripped = number.replaceAll("_", "");
			const { data, prefix } = getPrefix(stripped);
			const formatted = format(stripped, prefix, data, hasSeparators) + suffix;

			if (raw !== formatted) {
				context.report({
					message: "invalidGrouping",
					range: getTSNodeRange(node, sourceFile),
				});
			}
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
