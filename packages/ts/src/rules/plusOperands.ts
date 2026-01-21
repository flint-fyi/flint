import {
	type AST,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as tsutils from "ts-api-utils";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

type OperandType =
	| "bigint"
	| "boolean"
	| "invalid"
	| "null"
	| "number"
	| "RegExp"
	| "string"
	| "undefined";

function getConstrainedBaseType(
	node: AST.Expression,
	typeChecker: ts.TypeChecker,
): ts.Type {
	const type = typeChecker.getTypeAtLocation(node);
	const constrainedType = typeChecker.getBaseConstraintOfType(type) ?? type;
	return typeChecker.getBaseTypeOfLiteralType(constrainedType);
}

function getOperandType(type: ts.Type): OperandType {
	const constituents = tsutils.unionConstituents(type);

	for (const subType of constituents) {
		if (
			hasTypeFlag(
				subType,
				ts.TypeFlags.ESSymbolLike | ts.TypeFlags.Never | ts.TypeFlags.Unknown,
			)
		) {
			return "invalid";
		}
	}

	if (
		constituents.every((subType) =>
			hasTypeFlag(subType, ts.TypeFlags.BigIntLike),
		)
	) {
		return "bigint";
	}

	if (
		constituents.every((subType) =>
			hasTypeFlag(subType, ts.TypeFlags.NumberLike),
		)
	) {
		return "number";
	}

	if (
		constituents.every((subType) =>
			hasTypeFlag(subType, ts.TypeFlags.StringLike),
		)
	) {
		return "string";
	}

	if (
		constituents.every((subType) =>
			hasTypeFlag(subType, ts.TypeFlags.BooleanLike),
		)
	) {
		return "boolean";
	}

	if (
		constituents.every((subType) => hasTypeFlag(subType, ts.TypeFlags.Null))
	) {
		return "null";
	}

	if (
		constituents.every((subType) =>
			hasTypeFlag(subType, ts.TypeFlags.Undefined),
		)
	) {
		return "undefined";
	}

	for (const subType of constituents) {
		const symbol = subType.getSymbol();
		if (symbol?.getName() === "RegExp") {
			return "RegExp";
		}
	}

	return "invalid";
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

function isValidOperandType(operandType: OperandType): boolean {
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
				"Invalid operand for a '+' operation. Operands must each be a number or string. Got `{{ type }}`.",
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
			const rightType = getConstrainedBaseType(node.right, typeChecker);
			const leftOperandType = getOperandType(leftType);
			const rightOperandType = getOperandType(rightType);

			if (leftOperandType === "invalid") {
				context.report({
					data: { type: typeChecker.typeToString(leftType) },
					message: "invalidOperand",
					range: getTSNodeRange(node.left, sourceFile),
				});
				return;
			}

			if (rightOperandType === "invalid") {
				context.report({
					data: { type: typeChecker.typeToString(rightType) },
					message: "invalidOperand",
					range: getTSNodeRange(node.right, sourceFile),
				});
				return;
			}

			if (leftOperandType === rightOperandType) {
				if (isValidOperandType(leftOperandType)) {
					return;
				}
				context.report({
					data: { type: typeChecker.typeToString(leftType) },
					message: "invalidOperand",
					range: getTSNodeRange(node.left, sourceFile),
				});
				return;
			}

			if (
				(leftOperandType === "bigint" && rightOperandType === "number") ||
				(leftOperandType === "number" && rightOperandType === "bigint")
			) {
				context.report({
					data: {
						leftType: typeChecker.typeToString(leftType),
						rightType: typeChecker.typeToString(rightType),
					},
					message: "bigintAndNumber",
					range: getTSNodeRange(node, sourceFile),
				});
				return;
			}

			context.report({
				data: {
					leftType: typeChecker.typeToString(leftType),
					rightType: typeChecker.typeToString(rightType),
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
