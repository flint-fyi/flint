import { RegExpParser } from "@eslint-community/regexpp";

const parser = new RegExpParser();

export interface RegexpAstOptions {
	unicode?: boolean | undefined;
	unicodeSets?: boolean | undefined;
}

export function parseRegexpAst(pattern: string, flags = "") {
	try {
		return parser.parsePattern(pattern, undefined, undefined, {
			unicode: flags.includes("u"),
			unicodeSets: flags.includes("v"),
		});
	} catch {
		return undefined;
	}
}
