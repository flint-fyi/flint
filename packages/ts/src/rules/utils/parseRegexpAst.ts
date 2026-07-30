import { RegExpParser } from "@eslint-community/regexpp";
import type { Pattern } from "@eslint-community/regexpp/ast";

const parser = new RegExpParser();

export function parseRegexpAst(
	pattern: string,
	flags = "",
): Pattern | undefined {
	try {
		return parser.parsePattern(pattern, undefined, undefined, {
			unicode: flags.includes("u"),
			unicodeSets: flags.includes("v"),
		});
	} catch {
		return undefined;
	}
}
