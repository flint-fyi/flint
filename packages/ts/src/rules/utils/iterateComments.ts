import { createScanner, SyntaxKind } from "typescript-native/unstable/ast";

import { forEachChild, type AST } from "@flint.fyi/typescript-language";

export interface Comment {
	end: number;
	pos: number;
	text: string;
}

export function iterateComments(sourceFile: AST.SourceFile): Comment[] {
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
