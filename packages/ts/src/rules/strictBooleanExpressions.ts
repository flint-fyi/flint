import {
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as tsutils from "ts-api-utils";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports non-boolean types in boolean contexts that may cause unexpected behavior.",
		id: "strictBooleanExpressions",
		presets: ["logical"],
	},
	messages: {
		alwaysTruthy: {
			primary: "This condition is always truthy.",
			secondary: [
				"Non-nullable objects are always truthy in JavaScript.",
				"This makes the condition redundant or indicates a logic error.",
			],
			suggestions: ["Remove this condition or check a specific property."],
		},
		anyInCondition: {
			primary:
				"Using `any` in a boolean context can cause unexpected behavior.",
			secondary: [
				"The value could be any type, making the condition unpredictable.",
				"This defeats TypeScript's type safety guarantees.",
			],
			suggestions: [
				"Add explicit type narrowing or use `Boolean()` conversion.",
			],
		},
		nullableBoolean: {
			primary: "Nullable booleans require explicit null checks in conditions.",
			secondary: [
				"Using `boolean | null` or `boolean | undefined` directly can hide null coercion.",
				"The nullish value coerces to `false`, which may be unintentional.",
			],
			suggestions: [
				"Use `value === true` or `value ?? false` for explicit handling.",
			],
		},
	},
	setup(context) {
		function checkCondition(
			expression: ts.Expression,
			services: TypeScriptFileServices,
		) {
			const { sourceFile, typeChecker } = services;
			const type = typeChecker.getTypeAtLocation(expression);

			if (tsutils.isTypeFlagSet(type, ts.TypeFlags.Any)) {
				context.report({
					message: "anyInCondition",
					range: {
						begin: expression.getStart(sourceFile),
						end: expression.getEnd(),
					},
				});
				return;
			}

			if (isNullableBoolean(type)) {
				context.report({
					message: "nullableBoolean",
					range: {
						begin: expression.getStart(sourceFile),
						end: expression.getEnd(),
					},
				});
				return;
			}

			if (isAlwaysTruthyObject(type, typeChecker)) {
				context.report({
					message: "alwaysTruthy",
					range: {
						begin: expression.getStart(sourceFile),
						end: expression.getEnd(),
					},
				});
			}
		}

		function isNullableBoolean(type: ts.Type) {
			if (!type.isUnion()) {
				return false;
			}

			let hasBoolean = false;
			let hasNullOrUndefined = false;

			for (const constituent of type.types) {
				if (
					tsutils.isTypeFlagSet(
						constituent,
						ts.TypeFlags.BooleanLiteral | ts.TypeFlags.Boolean,
					)
				) {
					hasBoolean = true;
				}
				if (
					tsutils.isTypeFlagSet(
						constituent,
						ts.TypeFlags.Null | ts.TypeFlags.Undefined,
					)
				) {
					hasNullOrUndefined = true;
				}
			}

			return hasBoolean && hasNullOrUndefined;
		}

		function isAlwaysTruthyObject(type: ts.Type, checker: ts.TypeChecker) {
			if (type.isUnion()) {
				return false;
			}

			if (
				tsutils.isTypeFlagSet(
					type,
					ts.TypeFlags.Any |
						ts.TypeFlags.Unknown |
						ts.TypeFlags.Boolean |
						ts.TypeFlags.BooleanLiteral |
						ts.TypeFlags.String |
						ts.TypeFlags.StringLiteral |
						ts.TypeFlags.Number |
						ts.TypeFlags.NumberLiteral |
						ts.TypeFlags.BigInt |
						ts.TypeFlags.BigIntLiteral |
						ts.TypeFlags.Void |
						ts.TypeFlags.Undefined |
						ts.TypeFlags.Null |
						ts.TypeFlags.Never |
						ts.TypeFlags.Enum |
						ts.TypeFlags.EnumLiteral,
				)
			) {
				return false;
			}

			if (checker.isArrayType(type) || checker.isTupleType(type)) {
				return false;
			}

			const symbol = type.getSymbol();
			if (symbol) {
				const name = symbol.getName();
				if (name === "Array" || name === "ReadonlyArray") {
					return false;
				}
			}

			return (
				tsutils.isTypeFlagSet(type, ts.TypeFlags.Object) ||
				tsutils.isTypeFlagSet(type, ts.TypeFlags.NonPrimitive)
			);
		}

		return {
			visitors: {
				ConditionalExpression: (node, services) => {
					checkCondition(node.condition, services);
				},
				DoStatement: (node, services) => {
					checkCondition(node.expression, services);
				},
				ForStatement: (node, services) => {
					if (node.condition) {
						checkCondition(node.condition, services);
					}
				},
				IfStatement: (node, services) => {
					checkCondition(node.expression, services);
				},
				PrefixUnaryExpression: (node, services) => {
					if (node.operator === ts.SyntaxKind.ExclamationToken) {
						checkCondition(node.operand, services);
					}
				},
				WhileStatement: (node, services) => {
					checkCondition(node.expression, services);
				},
			},
		};
	},
});
