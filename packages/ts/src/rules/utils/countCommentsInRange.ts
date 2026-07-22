import ts, { SyntaxKind } from "typescript";

import type { CharacterReportRange } from "@flint.fyi/core";

export function countCommentsInRange(
	sourceText: string,
	{ begin, end }: CharacterReportRange,
) {
	const scanner = ts.createScanner(
		ts.ScriptTarget.Latest,
		false,
		ts.LanguageVariant.Standard,
		sourceText.slice(begin, end),
	);
	let count = 0;

	for (
		let token = scanner.scan();
		token !== SyntaxKind.EndOfFileToken;
		token = scanner.scan()
	) {
		if (
			token === SyntaxKind.SingleLineCommentTrivia ||
			token === SyntaxKind.MultiLineCommentTrivia
		) {
			count++;
		}
	}

	return count;
}
