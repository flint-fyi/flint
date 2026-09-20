import {
	createScanner as createNativeScanner,
	SyntaxKind,
	type LanguageVariant,
	type Scanner,
} from "typescript-native/unstable/ast";

/**
 * Creates a `typescript-native` scanner whose `scan()` always makes progress.
 *
 * The native JS scanner does not advance past a `#` that isn't followed by an
 * identifier start, such as the `&amp;#39;` HTML entity in JSX text: it returns a
 * zero-width `PrivateIdentifier` at the same position on every `scan()`, so a
 * loop that scans to `EndOfFile` never terminates. TypeScript 6 consumed that
 * `#` as a one-character token instead. This wrapper skips the stray `#` and
 * moves on to the next token.
 */
export function createScanner(
	skipTrivia: boolean,
	languageVariant?: LanguageVariant,
	text?: string,
	start?: number,
	length?: number,
): Scanner {
	const scanner = createNativeScanner(
		skipTrivia,
		languageVariant,
		text,
		start,
		length,
	);
	const scan = scanner.scan.bind(scanner);

	scanner.scan = () => {
		const token = scan();
		if (
			token === SyntaxKind.PrivateIdentifier &&
			scanner.getTokenEnd() === scanner.getTokenStart()
		) {
			scanner.resetTokenState(scanner.getTokenStart() + 1);
			return scanner.scan();
		}
		return token;
	};

	return scanner;
}
