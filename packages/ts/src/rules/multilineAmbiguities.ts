import * as ts from "typescript";

import { typescriptLanguage } from "../language.ts";
import type * as AST from "../types/ast.ts";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports ambiguous multiline expressions that could be misinterpreted.",
		id: "multilineAmbiguities",
		preset: "stylistic",
	},
	messages: {
		ambiguity: {
			primary:
				"This ambiguous line break before {{ after }} will be misinterpreted as a {{ interpretation }}.",
			secondary: [
				"When a line ends with an expression and the next line starts with {{ after }}, it may be interpreted as a {{ interpretation }} instead of two separate statements.",
				"This can lead to unexpected behavior and runtime errors that are difficult to debug.",
			],
			suggestions: [
				"Add a semicolon after the first line to make it clear they are separate statements.",
				"Alternatively, move the {{ after }} to the same line as the first expression if a {{ interpretation }} is intended.",
			],
		},
	},
	setup(context) {
		function checkMultilineDelimiter(
			expressionEnd: number,
			delimiterStart: number,
			after: string,
			interpretation: string,
			sourceFile: ts.SourceFile,
		) {
			const { line: expressionEndLine } =
				sourceFile.getLineAndCharacterOfPosition(expressionEnd);
			const { line: delimiterLine } =
				sourceFile.getLineAndCharacterOfPosition(delimiterStart);

			if (expressionEndLine < delimiterLine) {
				context.report({
					data: { after, interpretation },
					message: "ambiguity",
					range: {
						begin: delimiterStart,
						end: getLineEndPosition(delimiterLine, sourceFile),
					},
				});
			}
		}

		return {
			visitors: {
				CallExpression: (node, { sourceFile }) => {
					if (node.arguments.length === 0 || node.questionDotToken) {
						return;
					}

					const openParen = findChildToken(
						node,
						ts.SyntaxKind.OpenParenToken,
						sourceFile,
					);
					if (!openParen) {
						return;
					}

					// When there are type arguments, compare from the closing > token
					// rather than the expression end
					const precedingEnd = getExpressionEnd(node, sourceFile);

					checkMultilineDelimiter(
						precedingEnd,
						openParen.getStart(sourceFile),
						"parentheses",
						"function call",
						sourceFile,
					);
				},
				ElementAccessExpression: (node, { sourceFile }) => {
					if (node.questionDotToken) {
						return;
					}

					const openBracket = findChildToken(
						node,
						ts.SyntaxKind.OpenBracketToken,
						sourceFile,
					);
					if (!openBracket) {
						return;
					}

					checkMultilineDelimiter(
						node.expression.getEnd(),
						openBracket.getStart(sourceFile),
						"brackets",
						"property access",
						sourceFile,
					);
				},
				TaggedTemplateExpression: (node, { sourceFile }) => {
					checkMultilineDelimiter(
						node.tag.getEnd(),
						node.template.getStart(sourceFile),
						"a template literal",
						"tagged template",
						sourceFile,
					);
				},
			},
		};
	},
});

function findChildToken(
	node: AST.CallExpression | AST.ElementAccessExpression,
	kind: ts.SyntaxKind,
	sourceFile: ts.SourceFile,
) {
	for (const child of node.getChildren(sourceFile)) {
		if (child.kind === kind) {
			return child;
		}
	}
	return undefined;
}

function getExpressionEnd(node: AST.CallExpression, sourceFile: ts.SourceFile) {
	const greaterThan =
		node.typeArguments &&
		findChildToken(node, ts.SyntaxKind.GreaterThanToken, sourceFile);

	return greaterThan?.getEnd() ?? node.expression.getEnd();
}

function getLineEndPosition(lineNumber: number, sourceFile: ts.SourceFile) {
	const lineStarts = sourceFile.getLineStarts();
	const nextLineStart = lineStarts[lineNumber + 1];
	return nextLineStart === undefined ? sourceFile.getEnd() : nextLineStart - 1;
}
