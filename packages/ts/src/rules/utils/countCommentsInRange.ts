import { LanguageVariant, SyntaxKind } from "typescript-native/unstable/ast";

import type { CharacterReportRange } from "@flint.fyi/core";
import { createScanner } from "@flint.fyi/typescript-language";

export function countCommentsInRange(
	sourceText: string,
	{ begin, end }: CharacterReportRange,
): number {
	const scanner = createScanner(
		false,
		LanguageVariant.Standard,
		sourceText.slice(begin, end),
	);
	let count = 0;

	for (
		let token = scanner.scan();
		token !== SyntaxKind.EndOfFile;
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
