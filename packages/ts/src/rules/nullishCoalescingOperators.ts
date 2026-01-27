import type { CharacterReportRange } from "@flint.fyi/core";
import {
	type AST,
	type Checker,
	getTSNodeRange,
	hasSameTokens,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as tsutils from "ts-api-utils";
import ts from "typescript";
import { z } from "zod";

import { ruleCreator } from "./ruleCreator.ts";

type IgnorePrimitives =
	| boolean
	| Record<string, boolean | undefined>
	| undefined;

type NullishCheckOperator = "!" | "!=" | "!==" | "" | "==" | "===";

interface NullishContext {
	alternate?: AST.Expression;
	consequent?: AST.Expression;
	operator?: NullishCheckOperator;
	test?: AST.Expression;
}

function analyzeConditionalForNullish(
	node: AST.ConditionalExpression,
	sourceFile: AST.SourceFile,
): NullishContext {
	const { condition, whenFalse, whenTrue } = node;

	// Simple truthiness check: x ? x : y
	if (
		ts.isIdentifier(condition) &&
		ts.isIdentifier(whenTrue) &&
		condition.text === whenTrue.text
	) {
		return {
			alternate: whenFalse,
			consequent: whenTrue,
			operator: "",
			test: condition,
		};
	}

	// Negation: !x ? y : x
	if (
		ts.isPrefixUnaryExpression(condition) &&
		condition.operator === ts.SyntaxKind.ExclamationToken
	) {
		const operand = condition.operand;
		if (
			ts.isIdentifier(operand) &&
			ts.isIdentifier(whenFalse) &&
			operand.text === whenFalse.text
		) {
			return {
				alternate: whenTrue,
				consequent: whenFalse,
				operator: "!",
				test: operand,
			};
		}
	}

	// Comparison patterns: x !== null ? x : y
	if (ts.isBinaryExpression(condition) && isNullLikeComparison(condition)) {
		const { isNegation, value: testValue } =
			extractValueFromComparison(condition);

		if (!testValue) {
			return {};
		}

		const operator = getComparisonOperator(condition);
		const [alternate, consequent] = isNegation
			? [whenFalse, whenTrue]
			: [whenTrue, whenFalse];

		return {
			alternate,
			consequent,
			operator,
			test: testValue,
		};
	}

	// Logical AND pattern: x !== undefined && x !== null ? x : y
	if (
		ts.isBinaryExpression(condition) &&
		condition.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken
	) {
		const leftIsComparison = ts.isBinaryExpression(condition.left)
			? isNullLikeComparison(condition.left)
			: false;
		const rightIsComparison = ts.isBinaryExpression(condition.right)
			? isNullLikeComparison(condition.right)
			: false;

		if (leftIsComparison && rightIsComparison) {
			const leftComp = condition.left as AST.BinaryExpression;
			const rightComp = condition.right as AST.BinaryExpression;

			const leftValue = extractValueFromComparison(leftComp).value;
			const rightValue = extractValueFromComparison(rightComp).value;

			if (
				leftValue &&
				rightValue &&
				hasSameTokens(leftValue, rightValue, sourceFile)
			) {
				return {
					alternate: whenFalse,
					consequent: whenTrue,
					operator: "===",
					test: leftValue,
				};
			}
		}
	}

	// Logical OR pattern: x === undefined || x === null ? y : x
	if (
		ts.isBinaryExpression(condition) &&
		condition.operatorToken.kind === ts.SyntaxKind.BarBarToken
	) {
		const leftIsComparison = ts.isBinaryExpression(condition.left)
			? isNullLikeComparison(condition.left)
			: false;
		const rightIsComparison = ts.isBinaryExpression(condition.right)
			? isNullLikeComparison(condition.right)
			: false;

		if (leftIsComparison && rightIsComparison) {
			const leftComp = condition.left as AST.BinaryExpression;
			const rightComp = condition.right as AST.BinaryExpression;

			const leftValue = extractValueFromComparison(leftComp).value;
			const rightValue = extractValueFromComparison(rightComp).value;

			if (
				leftValue &&
				rightValue &&
				hasSameTokens(leftValue, rightValue, sourceFile)
			) {
				return {
					alternate: whenTrue,
					consequent: whenFalse,
					operator: "===",
					test: leftValue,
				};
			}
		}
	}

	return {};
}

function extractAssignmentFromIfStatement(node: AST.IfStatement) {
	let assignmentExpr: AST.Expression | undefined;

	if (ts.isBlock(node.thenStatement)) {
		if (node.thenStatement.statements.length === 1) {
			const stmt = node.thenStatement.statements[0];
			if (stmt && ts.isExpressionStatement(stmt)) {
				assignmentExpr = stmt.expression;
			}
		}
	} else if (ts.isExpressionStatement(node.thenStatement)) {
		assignmentExpr = node.thenStatement.expression;
	}

	if (
		!assignmentExpr ||
		!ts.isBinaryExpression(assignmentExpr) ||
		assignmentExpr.operatorToken.kind !== ts.SyntaxKind.EqualsToken
	) {
		return undefined;
	}

	return { left: assignmentExpr.left, right: assignmentExpr.right };
}

function extractValueFromComparison(node: AST.BinaryExpression): {
	isNegation: boolean;
	value: AST.Expression | null;
} {
	const isNegation =
		node.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsToken ||
		node.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken;

	if (isNullLike(node.left)) {
		return { isNegation, value: node.right };
	}

	if (isNullLike(node.right)) {
		return { isNegation, value: node.left };
	}

	return { isNegation, value: null };
}

function getComparisonOperator(
	node: AST.BinaryExpression,
): NullishCheckOperator {
	switch (node.operatorToken.kind) {
		case ts.SyntaxKind.EqualsEqualsEqualsToken:
			return "===";
		case ts.SyntaxKind.EqualsEqualsToken:
			return "==";
		case ts.SyntaxKind.ExclamationEqualsEqualsToken:
			return "!==";
		case ts.SyntaxKind.ExclamationEqualsToken:
			return "!=";
		default:
			return "";
	}
}

function getTypeFlags(type: ts.Type): ts.TypeFlags {
	let flags = 0;
	for (const constituent of tsutils.unionConstituents(type)) {
		for (const subConstituent of tsutils.intersectionConstituents(
			constituent,
		)) {
			flags |= subConstituent.getFlags();
		}
	}
	return flags;
}

function isConditionalTest(node: AST.AnyNode): boolean {
	switch (node.parent.kind) {
		case ts.SyntaxKind.BinaryExpression:
			if (
				node.parent.operatorToken.kind ===
					ts.SyntaxKind.AmpersandAmpersandToken ||
				node.parent.operatorToken.kind === ts.SyntaxKind.BarBarToken
			) {
				return isConditionalTest(node.parent);
			}
			return false;

		case ts.SyntaxKind.ConditionalExpression:
			return node.parent.condition === node || isConditionalTest(node.parent);

		case ts.SyntaxKind.DoStatement:
		case ts.SyntaxKind.IfStatement:
		case ts.SyntaxKind.WhileStatement:
			return node.parent.expression === node;

		case ts.SyntaxKind.ForStatement:
			return node.parent.condition === node;

		case ts.SyntaxKind.PrefixUnaryExpression:
			return (
				node.parent.operator === ts.SyntaxKind.ExclamationToken &&
				isConditionalTest(node.parent)
			);

		default:
			return false;
	}
}

function isFalsyLiteralType(part: ts.Type) {
	if (part.isNumberLiteral() && part.value === 0) {
		return true;
	}

	if (part.isStringLiteral() && part.value === "") {
		return true;
	}

	const flags = part.getFlags();

	if (flags & ts.TypeFlags.BooleanLiteral) {
		const literal = part as unknown as { intrinsicName?: string };
		if (literal.intrinsicName === "false") {
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

function isIfStatementNullishCheck(node: AST.IfStatement) {
	switch (node.expression.kind) {
		case ts.SyntaxKind.BinaryExpression:
			return isNullLikeComparison(node.expression);

		case ts.SyntaxKind.PrefixUnaryExpression:
			return node.expression.operator === ts.SyntaxKind.ExclamationToken;

		default:
			return false;
	}
}

function isMixedLogicalExpression(node: AST.BinaryExpression) {
	const seen = new Set<ts.Node>();
	const queue = [node.parent, node.left, node.right];

	for (const current of queue) {
		if (!seen.has(current)) {
			continue;
		}

		seen.add(current);

		if (ts.isBinaryExpression(current)) {
			if (
				current.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken
			) {
				return true;
			}

			if (
				current.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
				current.operatorToken.kind === ts.SyntaxKind.BarBarEqualsToken
			) {
				queue.push(current.parent, current.left, current.right);
			}
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

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function isNullLike(node: AST.AnyNode) {
	switch (node.kind) {
		case ts.SyntaxKind.Identifier:
			return node.text === "undefined";
		case ts.SyntaxKind.NullKeyword:
			return true;
		default:
			return false;
	}
}

function isNullLikeComparison(node: AST.BinaryExpression) {
	return (
		(node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsToken ||
			node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken ||
			node.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsToken ||
			node.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken) &&
		(isNullLike(node.left) || isNullLike(node.right))
	);
}

function isTypeEligibleForPreferNullish(
	type: ts.Type,
	ignorePrimitives: IgnorePrimitives,
) {
	if (
		!typeCanBeNullish(type) ||
		tsutils.isTypeFlagSet(type, ts.TypeFlags.Any | ts.TypeFlags.Unknown) ||
		!ignorePrimitives
	) {
		return true;
	}

	const ignorableFlags = [
		(ignorePrimitives === true ||
			(typeof ignorePrimitives === "object" && ignorePrimitives.bigint)) &&
			ts.TypeFlags.BigIntLike,
		(ignorePrimitives === true ||
			(typeof ignorePrimitives === "object" && ignorePrimitives.boolean)) &&
			ts.TypeFlags.BooleanLike,
		(ignorePrimitives === true ||
			(typeof ignorePrimitives === "object" && ignorePrimitives.number)) &&
			ts.TypeFlags.NumberLike,
		(ignorePrimitives === true ||
			(typeof ignorePrimitives === "object" && ignorePrimitives.string)) &&
			ts.TypeFlags.StringLike,
	]
		.filter((flag) => typeof flag === "number")
		.reduce((previous, flag) => previous | flag, 0);

	return ignorableFlags === 0 || !(getTypeFlags(type) & ignorableFlags);
}

function shouldIgnoreNode(
	node: AST.AnyNode,
	ignorePrimitives: IgnorePrimitives,
	typeChecker: Checker,
) {
	const type = typeChecker.getTypeAtLocation(node);
	return (
		tsutils.isTypeFlagSet(type, ts.TypeFlags.Any | ts.TypeFlags.Unknown) ||
		!typeCanBeNullish(type) ||
		typeHasNonNullishFalsyValues(type) ||
		!isTypeEligibleForPreferNullish(type, ignorePrimitives)
	);
}

function typeCanBeNullish(type: ts.Type) {
	return tsutils.unionConstituents(type).some(isNullishType);
}

function typeHasNonNullishFalsyValues(type: ts.Type) {
	return tsutils
		.unionConstituents(type)
		.some(
			(constituent) =>
				isFalsyLiteralType(constituent) ||
				constituent.getFlags() &
					(ts.TypeFlags.String |
						ts.TypeFlags.Number |
						ts.TypeFlags.BigInt |
						ts.TypeFlags.Boolean),
		);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Prefer nullish coalescing operator (??) over logical OR (||) for nullish values.",
		id: "nullishCoalescingOperators",
		presets: ["stylistic"],
	},
	messages: {
		noStrictNullCheck: {
			primary:
				"This rule requires the `strictNullChecks` compiler option to be turned on to function correctly.",
			secondary: [],
			suggestions: [],
		},
		preferNullish: {
			primary:
				"Prefer nullish coalescing operator (`??`) over logical OR (`||`) for nullish checks.",
			secondary: [
				"The `||` operator returns the right operand for any falsy value (empty string, 0, false, null, undefined).",
				"The `??` operator only returns the right operand for null or undefined, preserving other falsy values.",
			],
			suggestions: ["Replace `||` with `??`."],
		},
		preferNullishAssignment: {
			primary:
				"Prefer nullish coalescing assignment (`??=`) over assignment with null/undefined check.",
			secondary: [],
			suggestions: ["Replace with nullish coalescing assignment."],
		},
		preferNullishTernary: {
			primary:
				"Prefer nullish coalescing operator (`??`) over ternary expression for nullish checks.",
			secondary: [],
			suggestions: ["Replace with nullish coalescing."],
		},
	},

	options: {
		ignoreConditionalTests: z
			.boolean()
			.default(true)
			.describe(
				"Whether to skip cases where the expression is in a conditional context.",
			),
		ignoreIfStatements: z
			.boolean()
			.default(false)
			.describe("Whether to skip if statement patterns with nullish checks."),
		ignoreMixedLogicalExpressions: z
			.boolean()
			.default(false)
			.describe("Whether to skip expressions that mix && and || operators."),
		ignorePrimitives: z
			.union([
				z.boolean(),
				z.record(
					z.enum(["bigint", "boolean", "number", "string"]),
					z.boolean(),
				),
			])
			.default({ bigint: false, boolean: false, number: false, string: false })
			.describe(
				"Whether to skip primitive types. Can be a boolean or an object with per-type configuration.",
			),
		ignoreTernaryTests: z
			.boolean()
			.default(false)
			.describe("Whether to skip ternary expressions."),
	},

	setup(context) {
		function createNullishNodesFix(
			left: AST.AnyNode,
			right: AST.AnyNode,
			sourceFile: AST.SourceFile,
			range: CharacterReportRange,
		) {
			const testText = sourceFile.text.substring(
				left.getStart(sourceFile),
				left.getEnd(),
			);
			const alternateText = sourceFile.text.substring(
				right.getStart(sourceFile),
				right.getEnd(),
			);

			return {
				range,
				text: `${testText} ?? ${alternateText}`,
			};
		}

		return {
			visitors: {
				BinaryExpression: (node, { options, sourceFile, typeChecker }) => {
					if (
						(options.ignoreConditionalTests && isConditionalTest(node)) ||
						(options.ignoreMixedLogicalExpressions &&
							isMixedLogicalExpression(node)) ||
						![
							ts.SyntaxKind.BarBarEqualsToken,
							ts.SyntaxKind.BarBarToken,
						].includes(node.operatorToken.kind) ||
						shouldIgnoreNode(node.left, options.ignorePrimitives, typeChecker)
					) {
						return;
					}

					const range = getTSNodeRange(node.operatorToken, sourceFile);
					const fullRange = getTSNodeRange(node, sourceFile);

					context.report({
						fix: {
							range,
							text:
								node.operatorToken.kind === ts.SyntaxKind.BarBarToken
									? "??"
									: "??=",
						},
						message: "preferNullish",
						range: fullRange,
					});
				},
				ConditionalExpression: (node, { options, sourceFile, typeChecker }) => {
					if (
						options.ignoreTernaryTests ||
						(options.ignoreConditionalTests && isConditionalTest(node))
					) {
						return;
					}

					const { alternate, consequent, test } = analyzeConditionalForNullish(
						node,
						sourceFile,
					);

					if (
						!test ||
						!consequent ||
						!alternate ||
						shouldIgnoreNode(test, options.ignorePrimitives, typeChecker)
					) {
						return;
					}

					const range = getTSNodeRange(node, sourceFile);

					context.report({
						fix: createNullishNodesFix(test, alternate, sourceFile, range),
						message: "preferNullishTernary",
						range,
					});
				},
				IfStatement: (node, { options, sourceFile, typeChecker }) => {
					if (
						options.ignoreIfStatements ||
						node.elseStatement ||
						!isIfStatementNullishCheck(node)
					) {
						return;
					}

					const assignmentExpression = extractAssignmentFromIfStatement(node);
					if (
						!assignmentExpression ||
						shouldIgnoreNode(
							assignmentExpression.left,
							options.ignorePrimitives,
							typeChecker,
						)
					) {
						return;
					}

					const range = getTSNodeRange(node, sourceFile);

					context.report({
						fix: createNullishNodesFix(
							assignmentExpression.left,
							assignmentExpression.right,
							sourceFile,
							range,
						),
						message: "preferNullishAssignment",
						range,
					});
				},
			},
		};
	},
});
