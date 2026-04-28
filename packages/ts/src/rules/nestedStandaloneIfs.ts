import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts, { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function hasCommentsInRange(
	sourceFile: AST.SourceFile,
	start: number,
	end: number,
) {
	const text = sourceFile.text.slice(start, end);
	return text.includes("//") || text.includes("/*");
}

function isIfWithoutElse(
	node: ts.Node,
): node is AST.IfStatement & { elseStatement: undefined } {
	return ts.isIfStatement(node) && node.elseStatement === undefined;
}

const lowerPrecedenceThanLogicalAnd = new Set([
	SyntaxKind.BinaryExpression,
	SyntaxKind.ConditionalExpression,
	SyntaxKind.YieldExpression,
]);

function needsParentheses(node: AST.Expression) {
	if (node.kind !== SyntaxKind.BinaryExpression) {
		return lowerPrecedenceThanLogicalAnd.has(node.kind);
	}

	const operator = node.operatorToken.kind;
	return (
		operator === SyntaxKind.BarBarToken ||
		operator === SyntaxKind.QuestionQuestionToken ||
		operator === SyntaxKind.CommaToken ||
		operator === SyntaxKind.EqualsToken ||
		operator === SyntaxKind.PlusEqualsToken ||
		operator === SyntaxKind.MinusEqualsToken ||
		operator === SyntaxKind.AsteriskEqualsToken ||
		operator === SyntaxKind.SlashEqualsToken ||
		operator === SyntaxKind.PercentEqualsToken ||
		operator === SyntaxKind.AsteriskAsteriskEqualsToken ||
		operator === SyntaxKind.LessThanLessThanEqualsToken ||
		operator === SyntaxKind.GreaterThanGreaterThanEqualsToken ||
		operator === SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken ||
		operator === SyntaxKind.AmpersandEqualsToken ||
		operator === SyntaxKind.BarEqualsToken ||
		operator === SyntaxKind.CaretEqualsToken ||
		operator === SyntaxKind.BarBarEqualsToken ||
		operator === SyntaxKind.AmpersandAmpersandEqualsToken ||
		operator === SyntaxKind.QuestionQuestionEqualsToken
	);
}

function wrapWithParenthesesIfNeeded(
	expression: AST.Expression,
	sourceFile: AST.SourceFile,
) {
	const text = expression.getText(sourceFile);
	return needsParentheses(expression) ? `(${text})` : text;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports `if` statements that are the only statement inside an `else` block or inside another `if` without an `else`.",
		id: "nestedStandaloneIfs",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		lonelyIfInElse: {
			primary:
				"This `if` is the only statement in an `else` block and can be written as `else if`.",
			secondary: [
				"An `if` statement that is the only statement inside an `else` block can be collapsed into `else if`, which reduces nesting and improves readability.",
			],
			suggestions: ["Convert to `else if` to flatten the structure."],
		},
		lonelyIfInIf: {
			primary:
				"This `if` is the only statement inside another `if` without an `else` and can be combined using `&&`.",
			secondary: [
				"When an `if` statement is the only statement inside another `if` that has no `else`, the conditions can be combined with `&&` for simpler code.",
			],
			suggestions: ["Combine the conditions with `&&`."],
		},
	},
	setup(context) {
		function checkSoleBlockChild(
			node: AST.IfStatement,
			sourceFile: AST.SourceFile,
		) {
			if (
				node.parent.parent.kind === SyntaxKind.IfStatement &&
				node.parent.parent.elseStatement === node.parent
			) {
				const grandparent = node.parent.parent;
				const openBrace = node.parent.getStart(sourceFile);
				const closeBrace = node.parent.getEnd();

				if (
					hasCommentsInRange(
						sourceFile,
						openBrace + 1,
						node.getStart(sourceFile),
					)
				) {
					return;
				}

				if (hasCommentsInRange(sourceFile, node.getEnd(), closeBrace - 1)) {
					return;
				}

				const elseKeyword = grandparent
					.getChildren(sourceFile)
					.find((child) => child.kind === SyntaxKind.ElseKeyword);

				if (!elseKeyword) {
					return;
				}

				const nodeText = node.getText(sourceFile);

				context.report({
					fix: {
						range: {
							begin: node.parent.getStart(sourceFile),
							end: node.parent.getEnd(),
						},
						text: nodeText,
					},
					message: "lonelyIfInElse",
					range: getTSNodeRange(node, sourceFile),
				});

				return;
			}

			if (!isIfWithoutElse(node)) {
				return;
			}

			if (
				isIfWithoutElse(node.parent.parent) &&
				node.parent.parent.thenStatement === node.parent
			) {
				const outerIf = node.parent.parent;
				const openBrace = node.parent.getStart(sourceFile);
				const closeBrace = node.parent.getEnd();

				if (
					hasCommentsInRange(
						sourceFile,
						openBrace + 1,
						node.getStart(sourceFile),
					) ||
					hasCommentsInRange(sourceFile, node.getEnd(), closeBrace - 1)
				) {
					return;
				}

				const outerCondition = wrapWithParenthesesIfNeeded(
					outerIf.expression,
					sourceFile,
				);
				const innerCondition = wrapWithParenthesesIfNeeded(
					node.expression,
					sourceFile,
				);

				const consequentText = node.thenStatement.getText(sourceFile);
				const fixedText = `if (${outerCondition} && ${innerCondition}) ${consequentText}`;

				context.report({
					fix: {
						range: getTSNodeRange(outerIf, sourceFile),
						text: fixedText,
					},
					message: "lonelyIfInIf",
					range: getTSNodeRange(node, sourceFile),
				});

				return;
			}
		}

		function checkChildOfIfWithoutElse(
			node: AST.IfStatement,
			parent: AST.IfStatement,
			sourceFile: AST.SourceFile,
		) {
			const outerCondition = wrapWithParenthesesIfNeeded(
				parent.expression,
				sourceFile,
			);
			const innerCondition = wrapWithParenthesesIfNeeded(
				node.expression,
				sourceFile,
			);

			const consequentText = node.thenStatement.getText(sourceFile);
			const fixedText = `if (${outerCondition} && ${innerCondition}) ${consequentText}`;

			context.report({
				fix: {
					range: getTSNodeRange(parent, sourceFile),
					text: fixedText,
				},
				message: "lonelyIfInIf",
				range: getTSNodeRange(node, sourceFile),
			});
		}

		return {
			visitors: {
				IfStatement: (node, { sourceFile }) => {
					if (
						node.parent.kind === SyntaxKind.Block &&
						node.parent.statements.length === 1
					) {
						checkSoleBlockChild(node, sourceFile);
					} else if (
						isIfWithoutElse(node.parent) &&
						node.parent.thenStatement === node
					) {
						checkChildOfIfWithoutElse(node, node.parent, sourceFile);
					}
				},
			},
		};
	},
});
