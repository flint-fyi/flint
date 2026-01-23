import { typescriptLanguage } from "@flint.fyi/typescript-language";
import * as ts from "typescript";
import { z } from "zod";

import { ruleCreator } from "./ruleCreator.ts";

interface IrregularWhitespaceMatch {
	index: number;
	length: number;
}

function findIrregularWhitespaces(text: string): IrregularWhitespaceMatch[] {
	const irregularWhitespacePattern =
		/[\f\v\x85\ufeff\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u202f\u205f\u3000\u2028\u2029]/gu;

	const matches: IrregularWhitespaceMatch[] = [];
	let match: null | RegExpExecArray;

	while ((match = irregularWhitespacePattern.exec(text)) !== null) {
		matches.push({
			index: match.index,
			length: match[0].length,
		});
	}

	return matches;
}

function isInRange(position: number, start: number, end: number): boolean {
	return position >= start && position < end;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports irregular whitespace characters that can cause issues with code parsing and display.",
		id: "irregularWhitespaces",
		presets: ["logical"],
	},
	messages: {
		irregularWhitespace: {
			primary:
				"Irregular whitespace characters can cause unexpected behavior and display issues.",
			secondary: [
				"Irregular whitespace includes characters like non-breaking spaces (\\u00A0), zero-width spaces (\\u200B), and various Unicode space characters.",
				"These characters are often invisible or look like regular spaces, but may be interpreted differently by tools and parsers.",
				"They can be accidentally introduced through copy-paste from external sources.",
			],
			suggestions: [
				"Replace irregular whitespace with regular spaces or tabs.",
				"Remove the whitespace if it is unnecessary.",
			],
		},
	},
	options: {
		skipComments: z
			.boolean()
			.default(false)
			.describe("Whether to allow irregular whitespace in comments."),
		skipJSXText: z
			.boolean()
			.default(false)
			.describe("Whether to allow irregular whitespace in JSX text content."),
		skipRegularExpressions: z
			.boolean()
			.default(false)
			.describe(
				"Whether to allow irregular whitespace in regular expression literals.",
			),
		skipTemplates: z
			.boolean()
			.default(false)
			.describe("Whether to allow irregular whitespace in template literals."),
	},
	setup(context) {
		return {
			visitors: {
				SourceFile: (node, { options, sourceFile }) => {
					const text = sourceFile.getFullText();
					const allMatches = findIrregularWhitespaces(text);

					if (allMatches.length === 0) {
						return;
					}

					const excludedRanges: { end: number; start: number }[] = [];

					function collectExcludedRanges(astNode: ts.Node) {
						if (astNode.kind === ts.SyntaxKind.StringLiteral) {
							excludedRanges.push({
								end: astNode.getEnd(),
								start: astNode.getStart(sourceFile),
							});
						}

						if (
							options.skipRegularExpressions &&
							astNode.kind === ts.SyntaxKind.RegularExpressionLiteral
						) {
							excludedRanges.push({
								end: astNode.getEnd(),
								start: astNode.getStart(sourceFile),
							});
						}

						if (
							options.skipTemplates &&
							(astNode.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral ||
								astNode.kind === ts.SyntaxKind.TemplateHead ||
								astNode.kind === ts.SyntaxKind.TemplateMiddle ||
								astNode.kind === ts.SyntaxKind.TemplateTail)
						) {
							excludedRanges.push({
								end: astNode.getEnd(),
								start: astNode.getStart(sourceFile),
							});
						}

						if (options.skipJSXText && astNode.kind === ts.SyntaxKind.JsxText) {
							excludedRanges.push({
								end: astNode.getEnd(),
								start: astNode.getFullStart(),
							});
						}

						ts.forEachChild(astNode, collectExcludedRanges);
					}

					collectExcludedRanges(node);

					if (options.skipComments) {
						const commentRanges = [
							...(ts.getLeadingCommentRanges(text, 0) ?? []),
						];

						function collectCommentRanges(astNode: ts.Node) {
							const leading = ts.getLeadingCommentRanges(
								text,
								astNode.getFullStart(),
							);
							if (leading) {
								commentRanges.push(...leading);
							}

							const trailing = ts.getTrailingCommentRanges(
								text,
								astNode.getEnd(),
							);
							if (trailing) {
								commentRanges.push(...trailing);
							}

							ts.forEachChild(astNode, collectCommentRanges);
						}

						collectCommentRanges(node);

						for (const range of commentRanges) {
							excludedRanges.push({
								end: range.end,
								start: range.pos,
							});
						}
					}

					for (const match of allMatches) {
						const isExcluded = excludedRanges.some((range) =>
							isInRange(match.index, range.start, range.end),
						);

						if (isExcluded) {
							continue;
						}

						context.report({
							message: "irregularWhitespace",
							range: {
								begin: match.index,
								end: match.index + match.length,
							},
						});
					}
				},
			},
		};
	},
});
