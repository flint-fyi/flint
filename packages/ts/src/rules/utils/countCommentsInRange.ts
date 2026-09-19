import { LanguageVariant, SyntaxKind } from "typescript-native/unstable/ast";
import { createScanner } from "typescript-native/unstable/ast/scanner";

import type { CharacterReportRange } from "@flint.fyi/core";

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
