import { SyntaxKind } from "typescript-native/unstable/ast";
import { TypeFlags, type Type } from "typescript-native/unstable/sync";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";
import { getConstrainedTypeAtLocation } from "./utils/getConstrainedType.ts";

function getParentFunction(node: AST.AnyNode) {
	let current: AST.AnyNode | undefined = node.parent;

	while (current) {
		if (
			current.kind === SyntaxKind.FunctionDeclaration ||
			current.kind === SyntaxKind.FunctionExpression ||
			current.kind === SyntaxKind.ArrowFunction ||
			current.kind === SyntaxKind.MethodDeclaration
		) {
			return current;
		}
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- removing causes type error on the `while` loop. TSESLint bug?
		current = current.parent as AST.AnyNode | undefined;
	}

	return undefined;
}

function isInValidPosition(
	node: AST.AnyNode,
): { invalidAncestor: AST.AnyNode; valid: false } | { valid: true } {
	if (node.parent.kind === SyntaxKind.ExpressionStatement) {
		return { valid: true };
	}

	if (
		node.parent.kind === SyntaxKind.BinaryExpression &&
		node.parent.operatorToken.kind === SyntaxKind.CommaToken
	) {
		if (node.parent.right === node) {
			return isInValidPosition(node.parent);
		}
		return { valid: true };
	}

	if (node.parent.kind === SyntaxKind.ParenthesizedExpression) {
		return isInValidPosition(node.parent);
	}

	if (
		node.parent.kind === SyntaxKind.ConditionalExpression &&
		(node.parent.whenTrue === node || node.parent.whenFalse === node)
	) {
		return isInValidPosition(node.parent);
	}

	if (
		node.parent.kind === SyntaxKind.BinaryExpression &&
		(node.parent.operatorToken.kind === SyntaxKind.AmpersandAmpersandToken ||
			node.parent.operatorToken.kind === SyntaxKind.BarBarToken ||
			node.parent.operatorToken.kind === SyntaxKind.QuestionQuestionToken) &&
		node.parent.right === node
	) {
		return isInValidPosition(node.parent);
	}

	if (node.parent.kind === SyntaxKind.VoidExpression) {
		return { valid: true };
	}

	if (
		node.parent.kind === SyntaxKind.ArrowFunction &&
		node.parent.body === node
	) {
		return { invalidAncestor: node.parent, valid: false };
	}

	if (node.parent.kind === SyntaxKind.ReturnStatement) {
		return { invalidAncestor: node.parent, valid: false };
	}

	return { invalidAncestor: node, valid: false };
}

function isVoidLike(type: Type): boolean {
	return (type.flags & TypeFlags.VoidLike) !== 0;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Require expressions of type void to appear in statement position.",
		id: "misleadingVoidExpressions",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
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
	},
	setup(context) {
		function checkVoidExpression(
			node:
				| AST.AwaitExpression
				| AST.CallExpression
				| AST.TaggedTemplateExpression,
			{ typeChecker, sourceFile }: TypeScriptFileServices,
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

			if (invalidAncestor.kind === SyntaxKind.ArrowFunction) {
				const arrowBodyText = sourceFile.text.slice(
					invalidAncestor.body.getStart(sourceFile),
					invalidAncestor.body.getEnd(),
				);
				const nodeText = sourceFile.text.slice(
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
							text: `void ${nodeText}`,
						},
					],
				});
				return;
			}

			const nodeText = sourceFile.text.slice(
				node.getStart(sourceFile),
				node.getEnd(),
			);
			const suggestionBase = {
				id: "wrapWithVoid",
				range: getTSNodeRange(node, sourceFile),
				text: `void ${nodeText}`,
			};

			if (invalidAncestor.kind !== SyntaxKind.ReturnStatement) {
				context.report({
					message: "voidExpressionValue",
					range: getTSNodeRange(node, sourceFile),
					suggestions: [suggestionBase],
				});
				return;
			}

			const functionNode = getParentFunction(invalidAncestor);
			const isLastStatement =
				functionNode &&
				invalidAncestor.parent.kind === SyntaxKind.Block &&
				invalidAncestor.parent.parent === functionNode &&
				invalidAncestor.parent.statements.at(-1) === invalidAncestor;

			const returnValueText = invalidAncestor.expression
				? sourceFile.text.slice(
						invalidAncestor.expression.getStart(sourceFile),
						invalidAncestor.expression.getEnd(),
					)
				: "";

			context.report({
				message: "voidExpressionReturn",
				range: getTSNodeRange(node, sourceFile),
				suggestions: [
					isLastStatement
						? {
								id: "removeReturn",
								range: getTSNodeRange(invalidAncestor, sourceFile),
								text: `${returnValueText};`,
							}
						: {
								id: "moveBeforeReturn",
								range: getTSNodeRange(invalidAncestor, sourceFile),
								text: `${returnValueText}; return;`,
							},
					suggestionBase,
				],
			});
		}

		return {
			visitors: {
				AwaitExpression: checkVoidExpression,
				CallExpression: checkVoidExpression,
				TaggedTemplateExpression: checkVoidExpression,
			},
		};
	},
});
