import type { CharacterReportRange } from "@flint.fyi/core";
import typescript, {
	SyntaxKind,
} from "@flint.fyi/typescript-language/typescript";

export function countCommentsInRange(
	sourceText: string,
	{ begin, end }: CharacterReportRange,
): number {
	const scanner = typescript.createScanner(
		typescript.ScriptTarget.Latest,
		false,
		typescript.LanguageVariant.Standard,
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
