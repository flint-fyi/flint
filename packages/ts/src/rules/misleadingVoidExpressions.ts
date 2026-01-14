import * as tsutils from "ts-api-utils";
import * as ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import type * as AST from "../types/ast.ts";
import type { Checker } from "../types/checker.ts";
import { ruleCreator } from "./ruleCreator.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";

function isVoidLike(type: ts.Type) {
	return tsutils.isTypeFlagSet(type, ts.TypeFlags.VoidLike);
}

function isInValidPosition(
	node: ts.Node,
): { valid: true } | { invalidAncestor: ts.Node; valid: false } {
	const parent = node.parent;

	if (ts.isExpressionStatement(parent)) {
		return { valid: true };
	}

	if (
		ts.isBinaryExpression(parent) &&
		parent.operatorToken.kind === ts.SyntaxKind.CommaToken
	) {
		if (parent.right === node) {
			return isInValidPosition(parent);
		}
		return { valid: true };
	}

	if (ts.isParenthesizedExpression(parent)) {
		return isInValidPosition(parent);
	}

	if (
		ts.isConditionalExpression(parent) &&
		(parent.whenTrue === node || parent.whenFalse === node)
	) {
		return isInValidPosition(parent);
	}

	if (
		ts.isBinaryExpression(parent) &&
		(parent.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
			parent.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
			parent.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) &&
		parent.right === node
	) {
		return isInValidPosition(parent);
	}

	if (ts.isVoidExpression(parent)) {
		return { valid: true };
	}

	if (ts.isArrowFunction(parent) && parent.body === node) {
		return { invalidAncestor: parent, valid: false };
	}

	if (ts.isReturnStatement(parent)) {
		return { invalidAncestor: parent, valid: false };
	}

	return { invalidAncestor: node, valid: false };
}

function getParentFunction(node: ts.Node) {
	let current: ts.Node | undefined = node.parent;
	while (current) {
		if (
			ts.isFunctionDeclaration(current) ||
			ts.isFunctionExpression(current) ||
			ts.isArrowFunction(current) ||
			ts.isMethodDeclaration(current)
		) {
			return current;
		}
		current = current.parent;
	}
	return undefined;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Require expressions of type void to appear in statement position.",
		id: "misleadingVoidExpressions",
		presets: ["logical"],
	},
	messages: {
		voidExpressionValue: {
			primary: "Void expressions should not be used as values.",
			secondary: [
				"A `void` expression evaluates to `undefined` but its intent is to be ignored.",
				"Using void expressions as values can lead to confusing code and potential bugs.",
			],
			suggestions: [
				"Move the void expression to its own statement.",
				"Wrap with `void` operator to indicate the value is intentionally ignored.",
			],
		},
		voidExpressionArrow: {
			primary:
				"Returning a void expression from an arrow function shorthand is misleading.",
			secondary: [
				"Arrow function shorthand returns a value, but void expressions are meant to be ignored.",
				"This can confuse readers who expect a meaningful return value.",
			],
			suggestions: [
				"Add braces to the arrow function to make the void expression a statement.",
			],
		},
		voidExpressionReturn: {
			primary: "Returning a void expression from a function is misleading.",
			secondary: [
				"Return statements imply a value is being returned, but void expressions have no meaningful value.",
				"This can confuse readers about the function's intent.",
			],
			suggestions: [
				"Move the void expression before the return statement.",
				"Remove the return keyword if this is the last statement.",
			],
		},
	},
	setup(context) {
		function checkVoidExpression(
			node:
				| AST.CallExpression
				| AST.AwaitExpression
				| AST.TaggedTemplateExpression,
			typeChecker: Checker,
			sourceFile: ts.SourceFile,
		) {
			const type = getConstrainedTypeAtLocation(node, typeChecker);

			if (!isVoidLike(type)) {
				return;
			}

			const positionResult = isInValidPosition(node);
			if (positionResult.valid) {
				return;
			}

			const { invalidAncestor } = positionResult;

			if (ts.isArrowFunction(invalidAncestor)) {
				const arrowBodyText = sourceFile.text.slice(
					node.getStart(sourceFile),
					node.getEnd(),
				);
				context.report({
					message: "voidExpressionArrow",
					range: getTSNodeRange(node, sourceFile),
					suggestions: [
						{
							id: "addBraces",
							range: getTSNodeRange(invalidAncestor.body, sourceFile),
							text: `{ ${arrowBodyText}; }`,
						},
						{
							id: "wrapWithVoid",
							range: getTSNodeRange(node, sourceFile),
							text: `void ${arrowBodyText}`,
						},
					],
				});
				return;
			}

			if (ts.isReturnStatement(invalidAncestor)) {
				const functionNode = getParentFunction(invalidAncestor);
				const isLastStatement =
					functionNode &&
					ts.isBlock(invalidAncestor.parent) &&
					invalidAncestor.parent.parent === functionNode &&
					invalidAncestor.parent.statements[
						invalidAncestor.parent.statements.length - 1
					] === invalidAncestor;

				const returnValueText = invalidAncestor.expression
					? sourceFile.text.slice(
							invalidAncestor.expression.getStart(sourceFile),
							invalidAncestor.expression.getEnd(),
						)
					: "";

				if (isLastStatement) {
					context.report({
						message: "voidExpressionReturn",
						range: getTSNodeRange(node, sourceFile),
						suggestions: [
							{
								id: "removeReturn",
								range: getTSNodeRange(invalidAncestor, sourceFile),
								text: `${returnValueText};`,
							},
							{
								id: "wrapWithVoid",
								range: getTSNodeRange(node, sourceFile),
								text: `void ${returnValueText}`,
							},
						],
					});
				} else {
					context.report({
						message: "voidExpressionReturn",
						range: getTSNodeRange(node, sourceFile),
						suggestions: [
							{
								id: "moveBeforeReturn",
								range: getTSNodeRange(invalidAncestor, sourceFile),
								text: `${returnValueText}; return;`,
							},
							{
								id: "wrapWithVoid",
								range: getTSNodeRange(node, sourceFile),
								text: `void ${returnValueText}`,
							},
						],
					});
				}
				return;
			}

			const nodeText = sourceFile.text.slice(
				node.getStart(sourceFile),
				node.getEnd(),
			);
			context.report({
				message: "voidExpressionValue",
				range: getTSNodeRange(node, sourceFile),
				suggestions: [
					{
						id: "wrapWithVoid",
						range: getTSNodeRange(node, sourceFile),
						text: `void ${nodeText}`,
					},
				],
			});
		}

		return {
			visitors: {
				AwaitExpression: (node, { sourceFile, typeChecker }) => {
					checkVoidExpression(node, typeChecker, sourceFile);
				},
				CallExpression: (node, { sourceFile, typeChecker }) => {
					checkVoidExpression(node, typeChecker, sourceFile);
				},
				TaggedTemplateExpression: (node, { sourceFile, typeChecker }) => {
					checkVoidExpression(node, typeChecker, sourceFile);
				},
			},
		};
	},
});
