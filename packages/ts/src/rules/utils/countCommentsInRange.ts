import type { CharacterReportRange } from "@flint.fyi/core";
import ts from "typescript";

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
		token !== ts.SyntaxKind.EndOfFileToken;
		token = scanner.scan()
	) {
		if (
			token === ts.SyntaxKind.SingleLineCommentTrivia ||
			token === ts.SyntaxKind.MultiLineCommentTrivia
		) {
			count++;
		}
	}

	return count;
}
