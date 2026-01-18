import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function hasCommentsInRange(
	sourceFile: AST.SourceFile,
	start: number,
	end: number,
) {
	const fullText = sourceFile.getFullText();
	const text = fullText.slice(start, end);
	return text.includes("//") || text.includes("/*");
}

function isIfWithoutElse(
	node: AST.Statement,
): node is AST.IfStatement & { elseStatement: undefined } {
	return (
		node.kind === SyntaxKind.IfStatement && node.elseStatement === undefined
	);
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
		presets: ["stylistic"],
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
		return {
			visitors: {
				IfStatement: (node, { sourceFile }) => {
					const parent = node.parent;

					if (
						parent.kind === SyntaxKind.Block &&
						parent.statements.length === 1 &&
						parent.parent.kind === SyntaxKind.IfStatement &&
						parent.parent.elseStatement === parent
					) {
						const grandparent = parent.parent;
						const openBrace = parent.getStart(sourceFile);
						const closeBrace = parent.getEnd();

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
						const needsSpace = !nodeText.startsWith(" ");

						context.report({
							fix: {
								range: {
									begin: parent.getStart(sourceFile),
									end: parent.getEnd(),
								},
								text: needsSpace ? ` ${nodeText}` : nodeText,
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
						parent.kind === SyntaxKind.Block &&
						parent.statements.length === 1 &&
						isIfWithoutElse(parent.parent) &&
						parent.parent.thenStatement === parent
					) {
						const outerIf = parent.parent;
						const openBrace = parent.getStart(sourceFile);
						const closeBrace = parent.getEnd();

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

					if (isIfWithoutElse(parent) && parent.thenStatement === node) {
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
				},
			},
		};
	},
});
