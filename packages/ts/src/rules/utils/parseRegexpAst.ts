import { RegExpParser } from "@eslint-community/regexpp";

const parser = new RegExpParser();

export interface RegexpAstOptions {
	unicode?: boolean | undefined;
	unicodeSets?: boolean | undefined;
}

export function parseRegexpAst(
	pattern: string,
	options: RegexpAstOptions = {},
) {
	try {
		return parser.parsePattern(pattern, undefined, undefined, {
			unicode: options.unicode ?? false,
			unicodeSets: options.unicodeSets ?? true,
		});
	} catch {
		return undefined;
	}
}
