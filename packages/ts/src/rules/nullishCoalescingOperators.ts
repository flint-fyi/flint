import { SyntaxKind, type Node } from "typescript-native/unstable/ast";
import { TypeFlags, type Type } from "typescript-native/unstable/sync";
import { z } from "zod/v4";

import type { CharacterReportRange } from "@flint.fyi/core";
import {
	getTSNodeRange,
	hasSameTokens,
	typescriptLanguage,
	type AST,
	type Checker,
} from "@flint.fyi/typescript-language";

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
		condition.kind === SyntaxKind.Identifier &&
		whenTrue.kind === SyntaxKind.Identifier &&
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
		condition.kind === SyntaxKind.PrefixUnaryExpression &&
		condition.operator === SyntaxKind.ExclamationToken
	) {
		const operand = condition.operand;
		if (
			operand.kind === SyntaxKind.Identifier &&
			whenFalse.kind === SyntaxKind.Identifier &&
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
	if (
		condition.kind === SyntaxKind.BinaryExpression &&
		isNullLikeComparison(condition)
	) {
		const { isNegation, value: testValue } =
			extractValueFromComparison(condition);

		if (!testValue) {
			return {};
		}

		const operator = getComparisonOperator(condition);
		const [alternate, consequent] = isNegation
			? [whenFalse, whenTrue]
			: [whenTrue, whenFalse];

		// Verify consequent matches or accesses the test value
		if (!consequentMatchesTest(consequent, testValue, sourceFile)) {
			return {};
		}

		return {
			alternate,
			consequent,
			operator,
			test: testValue,
		};
	}

	// Logical AND pattern: x !== undefined && x !== null ? x : y
	if (
		condition.kind === SyntaxKind.BinaryExpression &&
		condition.operatorToken.kind === SyntaxKind.AmpersandAmpersandToken
	) {
		const leftIsComparison =
			condition.left.kind === SyntaxKind.BinaryExpression
				? isNullLikeComparison(condition.left)
				: false;
		const rightIsComparison =
			condition.right.kind === SyntaxKind.BinaryExpression
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
		condition.kind === SyntaxKind.BinaryExpression &&
		condition.operatorToken.kind === SyntaxKind.BarBarToken
	) {
		const leftIsComparison =
			condition.left.kind === SyntaxKind.BinaryExpression
				? isNullLikeComparison(condition.left)
				: false;
		const rightIsComparison =
			condition.right.kind === SyntaxKind.BinaryExpression
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

function consequentMatchesTest(
	consequent: AST.Expression,
	test: AST.Expression,
	sourceFile: AST.SourceFile,
): boolean {
	if (hasSameTokens(consequent, test, sourceFile)) {
		return true;
	}

	if (
		consequent.kind === SyntaxKind.PropertyAccessExpression ||
		consequent.kind === SyntaxKind.ElementAccessExpression ||
		consequent.kind === SyntaxKind.CallExpression
	) {
		return consequentMatchesTest(consequent.expression, test, sourceFile);
	}

	return false;
}

function extractAssignmentFromIfStatement(node: AST.IfStatement) {
	let assignmentExpr: AST.Expression | undefined;

	if (node.thenStatement.kind === SyntaxKind.Block) {
		if (node.thenStatement.statements.length === 1) {
			const stmt = node.thenStatement.statements[0];
			if (stmt?.kind === SyntaxKind.ExpressionStatement) {
				assignmentExpr = stmt.expression;
			}
		}
	} else if (node.thenStatement.kind === SyntaxKind.ExpressionStatement) {
		assignmentExpr = node.thenStatement.expression;
	}

	if (
		assignmentExpr?.kind !== SyntaxKind.BinaryExpression ||
		assignmentExpr.operatorToken.kind !== SyntaxKind.EqualsToken
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
		node.operatorToken.kind === SyntaxKind.ExclamationEqualsToken ||
		node.operatorToken.kind === SyntaxKind.ExclamationEqualsEqualsToken;

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
		case SyntaxKind.EqualsEqualsEqualsToken:
			return "===";
		case SyntaxKind.EqualsEqualsToken:
			return "==";
		case SyntaxKind.ExclamationEqualsEqualsToken:
			return "!==";
		case SyntaxKind.ExclamationEqualsToken:
			return "!=";
		default:
			return "";
	}
}

function getIfStatementNullishCheckValue(node: AST.IfStatement) {
	switch (node.expression.kind) {
		case SyntaxKind.BinaryExpression:
			if (isNullLikeComparison(node.expression)) {
				return extractValueFromComparison(node.expression).value ?? undefined;
			}
			return;

		case SyntaxKind.PrefixUnaryExpression:
			if (node.expression.operator === SyntaxKind.ExclamationToken) {
				return node.expression.operand;
			}
			return;

		default:
			return;
	}
}

function getIntersectionConstituents(type: Type): readonly Type[] {
	return type.isIntersectionType() ? type.getTypes() : [type];
}

function getTypeFlags(type: Type): TypeFlags {
	let flags = 0;
	for (const constituent of getUnionConstituents(type)) {
		for (const subConstituent of getIntersectionConstituents(constituent)) {
			flags |= subConstituent.flags;
		}
	}
	return flags;
}

function getUnionConstituents(type: Type): readonly Type[] {
	return type.isUnionType() ? type.getTypes() : [type];
}

function isConditionalTest(node: AST.AnyNode): boolean {
	switch (node.parent.kind) {
		case SyntaxKind.BinaryExpression:
			if (
				node.parent.operatorToken.kind === SyntaxKind.AmpersandAmpersandToken ||
				node.parent.operatorToken.kind === SyntaxKind.BarBarToken
			) {
				return isConditionalTest(node.parent);
			}
			return false;

		case SyntaxKind.ConditionalExpression:
			return node.parent.condition === node || isConditionalTest(node.parent);

		case SyntaxKind.DoStatement:
		case SyntaxKind.IfStatement:
		case SyntaxKind.WhileStatement:
			return node.parent.expression === node;

		case SyntaxKind.ForStatement:
			return node.parent.condition === node;

		case SyntaxKind.PrefixUnaryExpression:
			return (
				node.parent.operator === SyntaxKind.ExclamationToken &&
				isConditionalTest(node.parent)
			);

		default:
			return false;
	}
}

function isFalsyLiteralType(part: Type, checker: Checker): boolean {
	if (
		(part.flags & TypeFlags.NumberLiteral) !== 0 &&
		(part as Type & { value: number }).value === 0
	) {
		return true;
	}

	if (
		(part.flags & TypeFlags.StringLiteral) !== 0 &&
		(part as Type & { value: string }).value === ""
	) {
		return true;
	}

	const flags = part.flags;

	if (
		(flags & TypeFlags.BooleanLiteral) !== 0 &&
		checker.typeToString(part) === "false"
	) {
		return true;
	}

	if (
		(flags & TypeFlags.BigIntLiteral) !== 0 &&
		checker.typeToString(part) === "0n"
	) {
		return true;
	}

	return false;
}

function isMixedLogicalExpression(node: AST.BinaryExpression) {
	const seen = new Set<Node>();
	const queue = [node.parent, node.left, node.right];

	for (const current of queue) {
		if (!seen.has(current)) {
			continue;
		}

		seen.add(current);

		if (current.kind === SyntaxKind.BinaryExpression) {
			if (current.operatorToken.kind === SyntaxKind.AmpersandAmpersandToken) {
				return true;
			}

			if (
				current.operatorToken.kind === SyntaxKind.BarBarToken ||
				current.operatorToken.kind === SyntaxKind.BarBarEqualsToken
			) {
				queue.push(current.parent, current.left, current.right);
			}
		}
	}

	return false;
}

function isNullishType(type: Type): boolean {
	return (type.flags & (TypeFlags.Null | TypeFlags.Undefined)) !== 0;
}

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function isNullLike(node: AST.AnyNode) {
	switch (node.kind) {
		case SyntaxKind.Identifier:
			return node.text === "undefined";
		case SyntaxKind.NullKeyword:
			return true;
		default:
			return false;
	}
}

function isNullLikeComparison(node: AST.BinaryExpression) {
	return (
		(node.operatorToken.kind === SyntaxKind.EqualsEqualsToken ||
			node.operatorToken.kind === SyntaxKind.EqualsEqualsEqualsToken ||
			node.operatorToken.kind === SyntaxKind.ExclamationEqualsToken ||
			node.operatorToken.kind === SyntaxKind.ExclamationEqualsEqualsToken) &&
		(isNullLike(node.left) || isNullLike(node.right))
	);
}

function isTypeEligibleForPreferNullish(
	type: Type,
	ignorePrimitives: IgnorePrimitives,
) {
	if (
		!typeCanBeNullish(type) ||
		(type.flags & (TypeFlags.Any | TypeFlags.Unknown)) !== 0 ||
		!ignorePrimitives
	) {
		return true;
	}

	const ignorableFlags = [
		(ignorePrimitives === true ||
			(typeof ignorePrimitives === "object" && ignorePrimitives.bigint)) &&
			TypeFlags.BigIntLike,
		(ignorePrimitives === true ||
			(typeof ignorePrimitives === "object" && ignorePrimitives.boolean)) &&
			TypeFlags.BooleanLike,
		(ignorePrimitives === true ||
			(typeof ignorePrimitives === "object" && ignorePrimitives.number)) &&
			TypeFlags.NumberLike,
		(ignorePrimitives === true ||
			(typeof ignorePrimitives === "object" && ignorePrimitives.string)) &&
			TypeFlags.StringLike,
	]
		.filter((flag) => typeof flag === "number")
		.reduce((previous, flag) => previous | flag, 0);

	return ignorableFlags === 0 || !(getTypeFlags(type) & ignorableFlags);
}

function shouldIgnoreNode(
	node: AST.AnyNode,
	ignorePrimitives: IgnorePrimitives,
	checker: Checker,
) {
	const type = checker.getTypeAtLocation(node);
	return (
		(type.flags & (TypeFlags.Any | TypeFlags.Unknown)) !== 0 ||
		!typeCanBeNullish(type) ||
		typeHasNonNullishFalsyValues(type, checker) ||
		!isTypeEligibleForPreferNullish(type, ignorePrimitives)
	);
}

function typeCanBeNullish(type: Type): boolean {
	return getUnionConstituents(type).some(isNullishType);
}

function typeHasNonNullishFalsyValues(type: Type, checker: Checker): boolean {
	return getUnionConstituents(type).some(
		(constituent) =>
			isFalsyLiteralType(constituent, checker) ||
			constituent.flags &
				(TypeFlags.String |
					TypeFlags.Number |
					TypeFlags.BigInt |
					TypeFlags.Boolean),
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Prefer nullish coalescing operator (??) over logical OR (||) for nullish values.",
		id: "nullishCoalescingOperators",
		presets: ["stylistic", "stylisticStrict"],
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
		function getOptionalChainInsertPosition(
			node: AST.AnyNode,
			test: AST.AnyNode,
			sourceFile: AST.SourceFile,
		) {
			if (
				node.kind === SyntaxKind.PropertyAccessExpression ||
				node.kind === SyntaxKind.ElementAccessExpression
			) {
				if (hasSameTokens(node.expression, test, sourceFile)) {
					return {
						needsDot: node.kind === SyntaxKind.ElementAccessExpression,
						pos: node.expression.getEnd(),
					};
				}
				return getOptionalChainInsertPosition(
					node.expression,
					test,
					sourceFile,
				);
			}
			if (node.kind === SyntaxKind.CallExpression) {
				return getOptionalChainInsertPosition(
					node.expression,
					test,
					sourceFile,
				);
			}
			return undefined;
		}

		function createNullishNodesFix(
			consequent: AST.AnyNode,
			alternate: AST.AnyNode,
			sourceFile: AST.SourceFile,
			range: CharacterReportRange,
			test?: AST.AnyNode,
		) {
			const getText = (node: AST.AnyNode) =>
				sourceFile.text.substring(node.getStart(sourceFile), node.getEnd());

			let leftText = getText(consequent);

			if (test && test !== consequent) {
				const insert = getOptionalChainInsertPosition(
					consequent,
					test,
					sourceFile,
				);
				if (insert) {
					const offset = insert.pos - consequent.getStart(sourceFile);
					leftText =
						leftText.slice(0, offset) +
						(insert.needsDot ? "?." : "?") +
						leftText.slice(offset);
				}
			}

			return { range, text: `${leftText} ?? ${getText(alternate)}` };
		}

		function createNullishAssignmentFix(
			left: AST.AnyNode,
			right: AST.AnyNode,
			sourceFile: AST.SourceFile,
			range: CharacterReportRange,
		) {
			const getText = (node: AST.AnyNode) =>
				sourceFile.text.substring(node.getStart(sourceFile), node.getEnd());

			return { range, text: `${getText(left)} ??= ${getText(right)};` };
		}

		return {
			visitors: {
				BinaryExpression: (node, { checker, options, sourceFile }) => {
					if (
						(options.ignoreConditionalTests && isConditionalTest(node)) ||
						(options.ignoreMixedLogicalExpressions &&
							isMixedLogicalExpression(node)) ||
						![SyntaxKind.BarBarEqualsToken, SyntaxKind.BarBarToken].includes(
							node.operatorToken.kind,
						) ||
						shouldIgnoreNode(node.left, options.ignorePrimitives, checker)
					) {
						return;
					}

					const range = getTSNodeRange(node.operatorToken, sourceFile);
					const fullRange = getTSNodeRange(node, sourceFile);

					context.report({
						fix: {
							range,
							text:
								node.operatorToken.kind === SyntaxKind.BarBarToken
									? "??"
									: "??=",
						},
						message: "preferNullish",
						range: fullRange,
					});
				},
				ConditionalExpression: (node, { checker, options, sourceFile }) => {
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
						shouldIgnoreNode(test, options.ignorePrimitives, checker)
					) {
						return;
					}

					const range = getTSNodeRange(node, sourceFile);
					context.report({
						fix: createNullishNodesFix(
							consequent,
							alternate,
							sourceFile,
							range,
							test,
						),
						message: "preferNullishTernary",
						range,
					});
				},
				IfStatement: (node, { checker, options, sourceFile }) => {
					const checkedValue = getIfStatementNullishCheckValue(node);
					if (
						options.ignoreIfStatements ||
						node.elseStatement ||
						!checkedValue
					) {
						return;
					}

					const assignmentExpression = extractAssignmentFromIfStatement(node);
					if (
						!assignmentExpression ||
						!hasSameTokens(
							assignmentExpression.left,
							checkedValue,
							sourceFile,
						) ||
						shouldIgnoreNode(
							assignmentExpression.left,
							options.ignorePrimitives,
							checker,
						)
					) {
						return;
					}

					const range = getTSNodeRange(node, sourceFile);

					context.report({
						fix: createNullishAssignmentFix(
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
