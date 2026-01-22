import {
	type AST,
	type Checker,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as tsutils from "ts-api-utils";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedTypeAtLocation.ts";

type OperandType =
	| "`any`"
	| "`never`"
	| "`unknown`"
	| "bigint"
	| "boolean"
	| "non-primitive"
	| "null"
	| "number"
	| "object"
	| "RegExp"
	| "string"
	| "symbol"
	| "undefined";

const invalidOperandTypes = new Set<OperandType>([
	"`any`",
	"`never`",
	"`unknown`",
	"boolean",
	"non-primitive",
	"null",
	"object",
	"RegExp",
	"symbol",
	"undefined",
]);

const typeFlagOperands = {
	overriding: [
		[ts.TypeFlags.ESSymbolLike, "symbol"],
		[ts.TypeFlags.Any, "`any`"],
		[ts.TypeFlags.Never, "`never`"],
		[ts.TypeFlags.Unknown, "`unknown`"],
	],
	secondary: [
		[ts.TypeFlags.BigIntLike, "bigint"],
		[ts.TypeFlags.NumberLike, "number"],
		[ts.TypeFlags.StringLike, "string"],
		[ts.TypeFlags.BooleanLike, "boolean"],
		[ts.TypeFlags.Null, "null"],
		[ts.TypeFlags.Undefined, "undefined"],
	],
} as const;

function getConstrainedBaseType(node: AST.Expression, typeChecker: Checker) {
	return typeChecker.getBaseTypeOfLiteralType(
		getConstrainedTypeAtLocation(node, typeChecker),
	);
}

function getOperandType(type: ts.Type): OperandType {
	const constituents = tsutils.unionConstituents(type);

	for (const subType of constituents) {
		for (const [typeFlag, operandType] of typeFlagOperands.overriding) {
			if (hasTypeFlag(subType, typeFlag)) {
				return operandType;
			}
		}
	}

	for (const subType of constituents) {
		for (const [typeFlag, operandType] of typeFlagOperands.secondary) {
			if (hasTypeFlag(subType, typeFlag)) {
				return operandType;
			}
		}

		const symbol = subType.getSymbol();
		if (symbol?.getName() === "RegExp") {
			return "RegExp";
		}
	}

	return "object";
}

function hasTypeFlag(type: ts.Type, flag: ts.TypeFlags): boolean {
	if (tsutils.isTypeFlagSet(type, flag)) {
		return true;
	}
	if (type.isIntersection()) {
		return type.types.some((subType) => hasTypeFlag(subType, flag));
	}
	return false;
}

function isValidOperandType(operandType: string) {
	return (
		operandType === "number" ||
		operandType === "bigint" ||
		operandType === "string"
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Require both operands of addition to be the same type and be `bigint`, `number`, or `string`.",
		id: "plusOperands",
		presets: ["logical"],
	},
	messages: {
		bigintAndNumber: {
			primary:
				"Numeric '+' operations must either be both bigints or both numbers. Got `{{ leftType }}` + `{{ rightType }}`.",
			secondary: [
				"Mixing bigint and number types in addition is not allowed in JavaScript.",
				"Both operands must be of the same numeric type.",
			],
			suggestions: ["Convert both operands to the same numeric type."],
		},
		invalidOperand: {
			primary:
				"This {{ type }} operand is invalid for a '+' operation. Operands must each be a numeric or string value.",
			secondary: [
				"The '+' operator only works reliably with numbers, bigints, or strings.",
				"Using other types like objects, symbols, or unknown values can cause unexpected behavior.",
			],
			suggestions: [
				"Convert the operand to a valid type before using it in addition.",
			],
		},
		mismatchedTypes: {
			primary:
				"Operands of '+' operations must be both numbers or both strings. Got `{{ leftType }}` + `{{ rightType }}`.",
			secondary: [
				"Mixing string and number types in addition leads to string concatenation, which may not be the intended behavior.",
				"Explicitly convert operands to the desired type for clarity.",
			],
			suggestions: [
				"Convert both operands to strings for concatenation.",
				"Convert both operands to numbers for numeric addition.",
			],
		},
	},
	setup(context) {
		function checkOperands(
			node: AST.BinaryExpression,
			{ sourceFile, typeChecker }: TypeScriptFileServices,
		) {
			const isPlusOperator =
				node.operatorToken.kind === ts.SyntaxKind.PlusToken;
			const isPlusEquals =
				node.operatorToken.kind === ts.SyntaxKind.PlusEqualsToken;

			if (!isPlusOperator && !isPlusEquals) {
				return;
			}

			const leftType = getConstrainedBaseType(node.left, typeChecker);
			const leftOperandType = getOperandType(leftType);

			if (invalidOperandTypes.has(leftOperandType)) {
				context.report({
					data: { type: leftOperandType },
					message: "invalidOperand",
					range: getTSNodeRange(node.left, sourceFile),
				});
				return;
			}

			const rightType = getConstrainedBaseType(node.right, typeChecker);
			const rightOperandType = getOperandType(rightType);

			if (invalidOperandTypes.has(rightOperandType)) {
				context.report({
					data: { type: rightOperandType },
					message: "invalidOperand",
					range: getTSNodeRange(node.right, sourceFile),
				});
				return;
			}

			if (leftOperandType === rightOperandType) {
				if (!isValidOperandType(leftOperandType)) {
					context.report({
						data: { type: leftOperandType },
						message: "invalidOperand",
						range: getTSNodeRange(node.left, sourceFile),
					});
				}
				return;
			}

			if (
				(leftOperandType === "bigint" && rightOperandType === "number") ||
				(leftOperandType === "number" && rightOperandType === "bigint")
			) {
				context.report({
					data: {
						leftType: leftOperandType,
						rightType: rightOperandType,
					},
					message: "bigintAndNumber",
					range: getTSNodeRange(node, sourceFile),
				});
				return;
			}

			context.report({
				data: {
					leftType: leftOperandType,
					rightType: rightOperandType,
				},
				message: "mismatchedTypes",
				range: getTSNodeRange(node, sourceFile),
			});
		}

		return {
			visitors: {
				BinaryExpression: checkOperands,
			},
		};
	},
});
