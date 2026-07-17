import {
	getLeadingCommentRanges,
	getTrailingCommentRanges,
	SyntaxKind,
} from "typescript";
import { z } from "zod/v4";

import {
	forEachChild,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

interface IrregularWhitespaceMatch {
	index: number;
	length: number;
}

function findIrregularWhitespaces(text: string): IrregularWhitespaceMatch[] {
	const irregularWhitespacePattern =
		/[\f\v\u{85}\u{FEFF}\u{A0}\u{1680}\u{180E}\u{2000}\u{2001}\u{2002}\u{2003}\u{2004}\u{2005}\u{2006}\u{2007}\u{2008}\u{2009}\u{200A}\u{200B}\u{202F}\u{205F}\u{3000}\u{2028}\u{2029}]/gu;

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
				String.raw`Irregular whitespace includes characters like non-breaking spaces (\u00A0), zero-width spaces (\u200B), and various Unicode space characters.`,
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

					if (!allMatches.length) {
						return;
					}

					const excludedRanges: { end: number; start: number }[] = [];

					function collectExcludedRanges(astNode: AST.AnyNode) {
						if (astNode.kind === SyntaxKind.StringLiteral) {
							excludedRanges.push({
								end: astNode.getEnd(),
								start: astNode.getStart(sourceFile),
							});
						}

						if (
							options.skipRegularExpressions &&
							astNode.kind === SyntaxKind.RegularExpressionLiteral
						) {
							excludedRanges.push({
								end: astNode.getEnd(),
								start: astNode.getStart(sourceFile),
							});
						}

						if (
							options.skipTemplates &&
							(astNode.kind === SyntaxKind.NoSubstitutionTemplateLiteral ||
								astNode.kind === SyntaxKind.TemplateHead ||
								astNode.kind === SyntaxKind.TemplateMiddle ||
								astNode.kind === SyntaxKind.TemplateTail)
						) {
							excludedRanges.push({
								end: astNode.getEnd(),
								start: astNode.getStart(sourceFile),
							});
						}

						if (options.skipJSXText && astNode.kind === SyntaxKind.JsxText) {
							excludedRanges.push({
								end: astNode.getEnd(),
								start: astNode.getFullStart(),
							});
						}

						forEachChild(astNode, collectExcludedRanges);
					}

					collectExcludedRanges(node);

					if (options.skipComments) {
						const commentRanges = [...(getLeadingCommentRanges(text, 0) ?? [])];

						function collectCommentRanges(astNode: AST.AnyNode) {
							const leading = getLeadingCommentRanges(
								text,
								astNode.getFullStart(),
							);
							if (leading) {
								commentRanges.push(...leading);
							}

							const trailing = getTrailingCommentRanges(text, astNode.getEnd());
							if (trailing) {
								commentRanges.push(...trailing);
							}

							forEachChild(astNode, collectCommentRanges);
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
