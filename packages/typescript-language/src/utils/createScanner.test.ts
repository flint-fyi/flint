import { LanguageVariant, SyntaxKind } from "typescript-native/unstable/ast";
import { describe, expect, it } from "vitest";

import { createScanner } from "./createScanner.ts";

function scanAll(text: string, languageVariant = LanguageVariant.Standard) {
	const scanner = createScanner(false, languageVariant, text);
	const tokens: [SyntaxKind, string][] = [];
	for (
		let kind = scanner.scan();
		kind !== SyntaxKind.EndOfFile;
		kind = scanner.scan()
	) {
		tokens.push([
			kind,
			text.slice(scanner.getTokenStart(), scanner.getTokenEnd()),
		]);
	}
	return tokens;
}

describe(createScanner, () => {
	it("scans tokens as the native scanner does when there is no stray #", () => {
		expect(scanAll("a // b")).toEqual([
			[SyntaxKind.Identifier, "a"],
			[SyntaxKind.WhitespaceTrivia, " "],
			[SyntaxKind.SingleLineCommentTrivia, "// b"],
		]);
	});

	it("scans private identifiers as the native scanner does", () => {
		expect(scanAll("#a")).toEqual([[SyntaxKind.PrivateIdentifier, "#a"]]);
	});

	it("reaches the end of the text when a # is not followed by an identifier", () => {
		const tokens = scanAll(
			"<div>Text with &#39; entity</div>",
			LanguageVariant.JSX,
		);

		expect(tokens).toContainEqual([SyntaxKind.NumericLiteral, "39"]);
		expect(tokens).toContainEqual([SyntaxKind.LessThanSlashToken, "</"]);
	});

	it("reaches the end of a bounded range when a # is not followed by an identifier", () => {
		const text = "a &#39; b";
		const scanner = createScanner(true, LanguageVariant.Standard, text, 2, 5);
		const kinds: SyntaxKind[] = [];
		for (
			let kind = scanner.scan();
			kind !== SyntaxKind.EndOfFile;
			kind = scanner.scan()
		) {
			kinds.push(kind);
		}
		expect(kinds).toEqual([
			SyntaxKind.AmpersandToken,
			SyntaxKind.NumericLiteral,
			SyntaxKind.SemicolonToken,
		]);
	});
});
