import * as tsutils from "ts-api-utils";
import ts, { SymbolFlags, SyntaxKind, TypeFlags, type Type } from "typescript";

import {
	getScopeManager,
	getTSNodeRange,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";

const constructors = {
	BigInt: { flag: TypeFlags.BigIntLike, type: "bigint" },
	Boolean: { flag: TypeFlags.BooleanLike, type: "boolean" },
	Number: { flag: TypeFlags.NumberLike, type: "number" },
	String: { flag: TypeFlags.StringLike, type: "string" },
} as const;

type Primitive = "bigint" | "boolean" | "number" | "string";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports type conversion idioms that do not change an expression's type or value.",
		id: "unnecessaryTypeConversions",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		unnecessaryTypeConversion: {
			primary:
				"This {{ violation }} is unnecessary because the expression is already {{ type }}.",
			secondary: [
				"Redundant conversions obscure the expression's existing type and value.",
				"A `satisfies` check can document the expected primitive type without converting the value.",
			],
			suggestions: ["Remove the conversion.", "Use a `satisfies` type check."],
		},
	},
	setup(context) {
		function report(
			node: AST.Expression,
			inner: AST.Expression,
			type: Primitive,
			violation: string,
			range: { begin: number; end: number },
			sourceFile: AST.SourceFile,
		) {
			const replacementRange = getTSNodeRange(node, sourceFile);
			const standaloneAssignment =
				node.kind === SyntaxKind.BinaryExpression &&
				node.operatorToken.kind === SyntaxKind.PlusEqualsToken &&
				node.parent.kind === SyntaxKind.ExpressionStatement;
			const removeRange = standaloneAssignment
				? getTSNodeRange(node.parent, sourceFile)
				: replacementRange;
			const innerText = sourceFile.text.slice(
				inner.getStart(sourceFile),
				inner.getEnd(),
			);

			context.report({
				data: { type, violation },
				message: "unnecessaryTypeConversion",
				range,
				suggestions: [
					{
						id: "removeTypeConversion",
						range: removeRange,
						text: standaloneAssignment
							? ""
							: replacementText(node, inner, innerText, sourceFile),
					},
					{
						id: "useSatisfies",
						range: replacementRange,
						text: satisfiesText(node, inner, innerText, type, sourceFile),
					},
				],
			});
		}

		return {
			visitors: {
				BinaryExpression(node, { sourceFile, typeChecker }) {
					if (node.operatorToken.kind === SyntaxKind.PlusEqualsToken) {
						if (
							isEmptyString(node.right) &&
							isEveryTypeFlag(
								typeChecker.getTypeAtLocation(node.left),
								TypeFlags.StringLike,
							)
						) {
							report(
								node,
								node.left,
								"string",
								"string assignment conversion",
								getTSNodeRange(node, sourceFile),
								sourceFile,
							);
						}
						return;
					}

					if (node.operatorToken.kind !== SyntaxKind.PlusToken) {
						return;
					}

					if (
						isEmptyString(node.right) &&
						isEveryTypeFlag(
							typeChecker.getTypeAtLocation(node.left),
							TypeFlags.StringLike,
						)
					) {
						report(
							node,
							node.left,
							"string",
							"string concatenation conversion",
							{
								begin: node.left.getEnd(),
								end: node.getEnd(),
							},
							sourceFile,
						);
						return;
					}

					if (
						isEmptyString(node.left) &&
						isEveryTypeFlag(
							typeChecker.getTypeAtLocation(node.right),
							TypeFlags.StringLike,
						)
					) {
						report(
							node,
							node.right,
							"string",
							"string concatenation conversion",
							{
								begin: node.getStart(sourceFile),
								end: node.right.getStart(sourceFile),
							},
							sourceFile,
						);
					}
				},
				CallExpression(node, { sourceFile, typeChecker }) {
					if (node.expression.kind === SyntaxKind.Identifier) {
						if (!(node.expression.text in constructors)) {
							return;
						}

						const constructor =
							constructors[node.expression.text as keyof typeof constructors];
						const argument = node.arguments[0];
						if (
							!argument ||
							getScopeManager(sourceFile).findVariable(node.expression) ||
							!isEveryTypeFlag(
								getConstrainedTypeAtLocation(argument, typeChecker),
								constructor.flag,
							)
						) {
							return;
						}

						report(
							node,
							argument,
							constructor.type,
							"constructor conversion",
							getTSNodeRange(node.expression, sourceFile),
							sourceFile,
						);
						return;
					}

					if (
						node.expression.kind !== SyntaxKind.PropertyAccessExpression ||
						node.expression.name.text !== "toString"
					) {
						return;
					}

					const receiver = node.expression.expression;
					const type = getConstrainedTypeAtLocation(receiver, typeChecker);
					if (
						!isEveryTypeFlag(type, TypeFlags.StringLike) ||
						isEnumMemberType(type) ||
						tsutils.isTypeFlagSet(type, TypeFlags.EnumLike)
					) {
						return;
					}

					report(
						node,
						receiver,
						"string",
						"method conversion",
						{
							begin: node.expression.name.getStart(sourceFile),
							end: node.getEnd(),
						},
						sourceFile,
					);
				},
				PrefixUnaryExpression(node, { sourceFile, typeChecker }) {
					let inner: AST.Expression | undefined;
					let type: Primitive | undefined;
					let operatorEnd = node.getStart(sourceFile) + 1;

					if (
						node.operator === SyntaxKind.PlusToken &&
						isEveryTypeFlag(
							typeChecker.getTypeAtLocation(node.operand),
							TypeFlags.NumberLike,
						)
					) {
						inner = node.operand;
						type = "number";
					} else if (
						node.operator === SyntaxKind.ExclamationToken &&
						node.operand.kind === SyntaxKind.PrefixUnaryExpression &&
						node.operand.operator === SyntaxKind.ExclamationToken &&
						isEveryTypeFlag(
							typeChecker.getTypeAtLocation(node.operand.operand),
							TypeFlags.BooleanLike,
						)
					) {
						inner = node.operand.operand;
						type = "boolean";
						operatorEnd = node.operand.getStart(sourceFile) + 1;
					} else if (
						node.operator === SyntaxKind.TildeToken &&
						node.operand.kind === SyntaxKind.PrefixUnaryExpression &&
						node.operand.operator === SyntaxKind.TildeToken &&
						isIntegerLiteralType(
							typeChecker.getTypeAtLocation(node.operand.operand),
						)
					) {
						inner = node.operand.operand;
						type = "number";
						operatorEnd = node.operand.getStart(sourceFile) + 1;
					}

					if (!inner || !type) {
						return;
					}

					report(
						node,
						inner,
						type,
						"unary conversion",
						{
							begin: node.getStart(sourceFile),
							end: operatorEnd,
						},
						sourceFile,
					);
				},
			},
		};
	},
});

function isEmptyString(node: AST.Expression) {
	return node.kind === SyntaxKind.StringLiteral && node.text === "";
}

function isEnumMemberType(type: Type) {
	const symbol = type.getSymbol();
	return symbol
		? tsutils.isSymbolFlagSet(symbol, SymbolFlags.EnumMember)
		: false;
}

function isEveryTypeFlag(type: Type, flag: TypeFlags) {
	return tsutils
		.unionConstituents(type)
		.every((part) => tsutils.isTypeFlagSet(part, flag));
}

function isIntegerLiteralType(type: Type) {
	return tsutils.unionConstituents(type).every((part) => {
		if (!tsutils.isNumberLiteralType(part)) {
			return false;
		}

		return Number.isInteger(part.value);
	});
}

function isSensitiveParent(node: AST.Expression) {
	const parent = node.parent;
	if (parent.kind === SyntaxKind.ParenthesizedExpression) {
		return false;
	}

	if (
		[
			SyntaxKind.AwaitExpression,
			SyntaxKind.BinaryExpression,
			SyntaxKind.ConditionalExpression,
			SyntaxKind.DeleteExpression,
			SyntaxKind.PrefixUnaryExpression,
			SyntaxKind.TypeOfExpression,
			SyntaxKind.VoidExpression,
		].includes(parent.kind)
	) {
		return true;
	}

	return (
		(parent.kind === SyntaxKind.PropertyAccessExpression &&
			parent.expression === node) ||
		(parent.kind === SyntaxKind.ElementAccessExpression &&
			parent.expression === node) ||
		((parent.kind === SyntaxKind.CallExpression ||
			parent.kind === SyntaxKind.NewExpression) &&
			parent.expression === node) ||
		(parent.kind === SyntaxKind.TaggedTemplateExpression && parent.tag === node)
	);
}

function isWeakExpression(node: AST.Expression) {
	return [
		SyntaxKind.ArrowFunction,
		SyntaxKind.BinaryExpression,
		SyntaxKind.CommaListExpression,
		SyntaxKind.ConditionalExpression,
		SyntaxKind.PrefixUnaryExpression,
		SyntaxKind.YieldExpression,
	].includes(node.kind);
}

function protectASI(
	node: AST.Expression,
	text: string,
	sourceFile: AST.SourceFile,
) {
	if (!text.startsWith("(") && !text.startsWith("[") && !text.startsWith("`")) {
		return text;
	}

	let outerExpression = node;
	while (ts.isExpression(outerExpression.parent)) {
		outerExpression = outerExpression.parent as AST.Expression;
	}

	if (outerExpression.parent.kind !== SyntaxKind.ExpressionStatement) {
		return text;
	}

	const precedingText = sourceFile.text
		.slice(0, outerExpression.parent.getStart(sourceFile))
		.trimEnd();
	return precedingText && !/[;{}]/u.test(precedingText.slice(-1))
		? `;${text}`
		: text;
}

function replacementText(
	node: AST.Expression,
	inner: AST.Expression,
	innerText: string,
	sourceFile: AST.SourceFile,
) {
	const text = isWeakExpression(inner) ? `(${innerText})` : innerText;
	return protectASI(node, text, sourceFile);
}

function satisfiesText(
	node: AST.Expression,
	inner: AST.Expression,
	innerText: string,
	type: Primitive,
	sourceFile: AST.SourceFile,
) {
	const checked = `${isWeakExpression(inner) ? `(${innerText})` : innerText} satisfies ${type}`;
	return protectASI(
		node,
		isSensitiveParent(node) ? `(${checked})` : checked,
		sourceFile,
	);
}
