import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

interface ScientificNotation {
	coefficient: string;
	magnitude: number;
}

function baseTenLosesPrecision(raw: string, value: number) {
	const rawNumber = raw.toLowerCase();
	const normalizedRawNumber = convertNumberToScientificNotation(
		rawNumber,
		false,
	);
	const requestedPrecision = normalizedRawNumber.coefficient.length;

	if (requestedPrecision > 100) {
		return true;
	}

	const storedNumber = value.toPrecision(requestedPrecision);
	const normalizedStoredNumber = convertNumberToScientificNotation(
		storedNumber,
		true,
	);

	return (
		normalizedRawNumber.magnitude !== normalizedStoredNumber.magnitude ||
		normalizedRawNumber.coefficient !== normalizedStoredNumber.coefficient
	);
}

function convertNumberToScientificNotation(
	stringNumber: string,
	parseAsFloat: boolean,
): ScientificNotation {
	const splitNumber = stringNumber.split("e");

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const originalCoefficient = splitNumber[0]!;

	const normalizedNumber =
		parseAsFloat || stringNumber.includes(".")
			? normalizeFloat(originalCoefficient)
			: normalizeInteger(originalCoefficient);

	if (splitNumber.length > 1) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		normalizedNumber.magnitude += parseInt(splitNumber[1]!, 10);
	}

	return normalizedNumber;
}

function getRaw(text: string) {
	return text.replace(/_/g, "");
}

function isBaseTen(raw: string) {
	const prefixes = ["0x", "0X", "0b", "0B", "0o", "0O"];
	return (
		prefixes.every((prefix) => !raw.startsWith(prefix)) &&
		!/^0[0-7]+$/.test(raw)
	);
}

function losesPrecision(raw: string, value: number) {
	if (value === 0) {
		return false;
	}

	return isBaseTen(raw)
		? baseTenLosesPrecision(raw, value)
		: notBaseTenLosesPrecision(raw, value);
}

function normalizeFloat(stringFloat: string): ScientificNotation {
	const trimmedFloat = removeLeadingZeros(stringFloat);
	const indexOfDecimalPoint = trimmedFloat.indexOf(".");

	switch (indexOfDecimalPoint) {
		case -1:
			return {
				coefficient: trimmedFloat,
				magnitude: trimmedFloat.length - 1,
			};
		case 0: {
			const significantDigits = removeLeadingZeros(trimmedFloat.slice(1));
			return {
				coefficient: significantDigits,
				magnitude: significantDigits.length - trimmedFloat.length,
			};
		}
		default:
			return {
				coefficient: trimmedFloat.replace(".", ""),
				magnitude: indexOfDecimalPoint - 1,
			};
	}
}

function normalizeInteger(stringInteger: string): ScientificNotation {
	const trimmedInteger = removeLeadingZeros(stringInteger);
	const significantDigits = removeTrailingZeros(trimmedInteger);
	return {
		coefficient: significantDigits,
		magnitude: trimmedInteger.length - 1,
	};
}

function notBaseTenLosesPrecision(raw: string, value: number) {
	const rawString = raw.toUpperCase();
	let base: number;

	if (rawString.startsWith("0B")) {
		base = 2;
	} else if (rawString.startsWith("0X")) {
		base = 16;
	} else {
		base = 8;
	}

	return !rawString.endsWith(value.toString(base).toUpperCase());
}

function removeLeadingZeros(numberAsString: string) {
	for (let i = 0; i < numberAsString.length; i++) {
		if (numberAsString[i] !== "0") {
			return numberAsString.slice(i);
		}
	}
	return numberAsString;
}

function removeTrailingZeros(numberAsString: string) {
	for (let i = numberAsString.length - 1; i >= 0; i--) {
		if (numberAsString[i] !== "0") {
			return numberAsString.slice(0, i + 1);
		}
	}
	return numberAsString;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports numeric literals that lose precision when converted to JavaScript numbers.",
		id: "numericPrecision",
		presets: ["logicalStrict"],
	},
	messages: {
		lossOfPrecision: {
			primary: "This number literal will lose precision at runtime.",
			secondary: [
				"JavaScript numbers are 64-bit floating-point values with limited precision.",
				"Numbers with more than 15-17 significant digits cannot be accurately represented.",
			],
			suggestions: [
				"If large amounts of precision are needed, switch to a `BigInt` or a different data structure.",
				"Remove the digits that are lost at runtime.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				NumericLiteral: (node, { sourceFile }) => {
					if (
						losesPrecision(getRaw(node.getText(sourceFile)), Number(node.text))
					) {
						context.report({
							message: "lossOfPrecision",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
			},
		};
	},
});
