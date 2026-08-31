import { createScanner, SyntaxKind } from "typescript-native/unstable/ast";

import { typescriptLanguage, type AST } from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports ambiguous multiline expressions that could be misinterpreted.",
		id: "multilineAmbiguities",
		presets: ["stylistic", "stylisticStrict"],
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
			sourceFile: AST.SourceFile,
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
					if (!node.arguments.length || node.questionDotToken) {
						return;
					}

					const openParen = findChildToken(
						node,
						SyntaxKind.OpenParenToken,
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
						openParen.begin,
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
						SyntaxKind.OpenBracketToken,
						sourceFile,
					);
					if (!openBracket) {
						return;
					}

					checkMultilineDelimiter(
						node.expression.getEnd(),
						openBracket.begin,
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
	kind: SyntaxKind,
	sourceFile: AST.SourceFile,
) {
	const begin = node.expression.getEnd();
	const scanner = createScanner(
		true,
		sourceFile.languageVariant,
		sourceFile.text,
		begin,
		node.getEnd() - begin,
	);
	let range: undefined | { begin: number; end: number };
	let tokenKind = scanner.scan();
	while (tokenKind !== SyntaxKind.EndOfFile) {
		if (tokenKind === kind) {
			range = { begin: scanner.getTokenStart(), end: scanner.getTokenEnd() };
			if (kind !== SyntaxKind.GreaterThanToken) {
				return range;
			}
		}
		tokenKind = scanner.scan();
	}
	return range;
}

function getExpressionEnd(
	node: AST.CallExpression,
	sourceFile: AST.SourceFile,
) {
	const greaterThan =
		node.typeArguments &&
		findChildToken(node, SyntaxKind.GreaterThanToken, sourceFile);

	return greaterThan?.end ?? node.expression.getEnd();
}

function getLineEndPosition(lineNumber: number, sourceFile: AST.SourceFile) {
	const lineStarts = sourceFile.getLineStarts();
	const nextLineStart = lineStarts[lineNumber + 1];
	return nextLineStart === undefined ? sourceFile.getEnd() : nextLineStart - 1;
}
