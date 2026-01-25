import { RegExpParser } from "@eslint-community/regexpp";
import type { ParsedLiteral } from "scslre";

const parser = new RegExpParser();

export function parseRegexpAstFull(
	pattern: string,
	flags = "",
): ParsedLiteral | undefined {
	try {
		const regexpFlags = parser.parseFlags(flags);
		const regexpPattern = parser.parsePattern(
			pattern,
			undefined,
			undefined,
			regexpFlags,
		);

		return {
			flags: regexpFlags,
			pattern: regexpPattern,
		};
	} catch {
		return undefined;
	}
}
