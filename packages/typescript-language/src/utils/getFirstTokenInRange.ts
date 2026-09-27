import { SyntaxKind } from "typescript-native/unstable/ast";

import type * as AST from "../types/ast.ts";
import { createScanner } from "./createScanner.ts";
import type { TokenRange } from "./findTokenInRange.ts";

/**
 * The first non-trivia token within `[begin, end)` of the file, if any.
 * As with `findTokenInRange`, the range must start outside any template
 * literal, regular expression literal, or JSX text.
 */
export function getFirstTokenInRange(
	sourceFile: AST.SourceFile,
	begin: number,
	end: number = sourceFile.text.length,
): TokenRange | undefined {
	const scanner = createScanner(
		true,
		sourceFile.languageVariant,
		sourceFile.text,
		begin,
		end - begin,
	);
	const kind = scanner.scan();
	return kind === SyntaxKind.EndOfFile
		? undefined
		: { begin: scanner.getTokenStart(), end: scanner.getTokenEnd(), kind };
}
