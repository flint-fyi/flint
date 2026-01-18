import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as tsutils from "ts-api-utils";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function isFalsyLiteralType(part: ts.Type) {
	if (part.isNumberLiteral() && part.value === 0) {
		return true;
	}

	if (part.isStringLiteral() && part.value === "") {
		return true;
	}

	const flags = part.getFlags();

	if (flags & ts.TypeFlags.BooleanLiteral) {
		if ((part as ts.LiteralType).intrinsicName === "false") {
			return true;
		}
	}

	if (flags & ts.TypeFlags.BigIntLiteral) {
		const value = (part as ts.BigIntLiteralType).value;
		if (!value.negative && value.base10Value === "0") {
			return true;
		}
	}

	return false;
}

function isNullishType(type: ts.Type) {
	return tsutils.isTypeFlagSet(
		type,
		ts.TypeFlags.Null | ts.TypeFlags.Undefined,
	);
}

function typeCanBeNullish(type: ts.Type) {
	return tsutils.unionConstituents(type).some(isNullishType);
}

function typeHasNonNullishFalsyValues(type: ts.Type) {
	for (const part of tsutils.unionConstituents(type)) {
		if (isFalsyLiteralType(part)) {
			return true;
		}

		const flags = part.getFlags();

		if (flags & ts.TypeFlags.String) {
			return true;
		}

		if (flags & ts.TypeFlags.Number) {
			return true;
		}

		if (flags & ts.TypeFlags.BigInt) {
			return true;
		}

		if (flags & ts.TypeFlags.Boolean) {
			return true;
		}
	}

	return false;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Prefer nullish coalescing operator (??) over logical OR (||) for nullish values.",
		id: "nullishCoalescingOperators",
		presets: ["stylistic"],
	},
	messages: {
		preferNullish: {
			primary:
				"Prefer nullish coalescing operator (`??`) over logical OR (`||`) for nullish checks.",
			secondary: [
				"The `||` operator returns the right operand for any falsy value (empty string, 0, false, null, undefined).",
				"The `??` operator only returns the right operand for null or undefined, preserving other falsy values.",
			],
			suggestions: ["Replace `||` with `??`."],
		},
	},
	setup(context) {
		return {
			visitors: {
				BinaryExpression: (node, { sourceFile, typeChecker }) => {
					if (node.operatorToken.kind !== ts.SyntaxKind.BarBarToken) {
						return;
					}

					const leftType = typeChecker.getTypeAtLocation(node.left);

					if (
						tsutils.isTypeFlagSet(
							leftType,
							ts.TypeFlags.Any | ts.TypeFlags.Unknown,
						)
					) {
						return;
					}

					if (!typeCanBeNullish(leftType)) {
						return;
					}

					if (typeHasNonNullishFalsyValues(leftType)) {
						return;
					}

					const range = getTSNodeRange(node.operatorToken, sourceFile);
					const fullRange = getTSNodeRange(node, sourceFile);

					context.report({
						fix: {
							range,
							text: "??",
						},
						message: "preferNullish",
						range: fullRange,
					});
				},
			},
		};
	},
});
