import { SyntaxKind } from "typescript-native/unstable/ast";

import type * as AST from "../types/ast.ts";
import { createScanner } from "./createScanner.ts";

export interface TokenRange {
	begin: number;
	end: number;
	kind: SyntaxKind;
}

/**
 * Finds the first token of the given kind within `[begin, end)` of the file,
 * skipping trivia. Use this to locate tokens the AST doesn't represent as
 * nodes, such as keywords and punctuation.
 *
 * The range must start outside any template literal, regular expression
 * literal, or JSX text, which a scanner can't tokenize without the parser.
 */
export function findTokenInRange(
	sourceFile: AST.SourceFile,
	kind: SyntaxKind,
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
	for (
		let tokenKind = scanner.scan();
		tokenKind !== SyntaxKind.EndOfFile;
		tokenKind = scanner.scan()
	) {
		if (tokenKind === kind) {
			return {
				begin: scanner.getTokenStart(),
				end: scanner.getTokenEnd(),
				kind,
			};
		}
	}
	return undefined;
}
