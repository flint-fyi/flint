import { SyntaxKind } from "typescript-native/unstable/ast";

import type * as AST from "../types/ast.ts";
import { createScanner } from "./createScanner.ts";
import { forEachChild } from "./forEachChild.ts";

export interface Comment {
	end: number;
	pos: number;
	text: string;
}

/**
 * Collects every comment in a source file, in source order.
 *
 * A scanner on its own can't tokenize a whole file: template literals with
 * substitutions, regular expression literals, and JSX text all depend on the
 * parser to tell the scanner how to continue, and scanning them as ordinary
 * tokens garbles everything after them. Those tokens are already nodes in the
 * AST, so the text is scanned around them instead.
 */
export function collectComments(sourceFile: AST.SourceFile): Comment[] {
	const comments: Comment[] = [];
	const excludedRanges: { end: number; pos: number }[] = [];
	function collectExcludedRanges(node: AST.AnyNode): void {
		if (
			node.kind === SyntaxKind.NoSubstitutionTemplateLiteral ||
			node.kind === SyntaxKind.RegularExpressionLiteral ||
			node.kind === SyntaxKind.JsxText ||
			node.kind === SyntaxKind.TemplateHead ||
			node.kind === SyntaxKind.TemplateMiddle ||
			node.kind === SyntaxKind.TemplateTail
		) {
			excludedRanges.push({
				end: node.getEnd(),
				pos: node.getStart(sourceFile),
			});
			return;
		}
		forEachChild(node, collectExcludedRanges);
	}
	collectExcludedRanges(sourceFile);
	excludedRanges.sort((left, right) => left.pos - right.pos);

	let segmentStart = 0;
	for (const excludedRange of [
		...excludedRanges,
		{ end: sourceFile.text.length, pos: sourceFile.text.length },
	]) {
		collectCommentsInRange(segmentStart, excludedRange.pos);
		segmentStart = excludedRange.end;
	}

	return comments;

	function collectCommentsInRange(begin: number, end: number): void {
		const scanner = createScanner(
			false,
			sourceFile.languageVariant,
			sourceFile.text,
			begin,
			end - begin,
		);
		for (
			let kind = scanner.scan();
			kind !== SyntaxKind.EndOfFile;
			kind = scanner.scan()
		) {
			if (
				kind !== SyntaxKind.SingleLineCommentTrivia &&
				kind !== SyntaxKind.MultiLineCommentTrivia
			) {
				continue;
			}

			const pos = scanner.getTokenStart();
			const commentEnd = scanner.getTokenEnd();
			comments.push({
				end: commentEnd,
				pos,
				text: sourceFile.text.slice(pos, commentEnd),
			});
		}
	}
}
