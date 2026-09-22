import * as shiki from "shiki";
import { describe, expect, it } from "vitest";

import { codeToTokensBase, getSingletonHighlighter } from "./shiki.ts";

describe("restricted Shiki highlighter", () => {
	it.each([
		'const greeting: string = "Hello, 世界 👋";',
		"/* multiline\n * comment */\nclass Box<T> extends Parent<T> {\n\tvalue = `value ${1 + 2}`;\n}",
		"const pattern = /(?:ab)+/giu;\r\n\r\nconst number = 1_234n;",
	])("preserves upstream TypeScript tokens for %s", async (code) => {
		const options = { lang: "typescript", theme: "nord" } as const;
		expect(await codeToTokensBase(code, options)).toEqual(
			await shiki.codeToTokensBase(code, options),
		);
	});

	it("provides the upstream Nord theme to the ANSI renderer", async () => {
		const highlighter = await getSingletonHighlighter();
		const upstream = await shiki.getSingletonHighlighter({ themes: ["nord"] });

		expect(highlighter.getTheme("nord")).toEqual(upstream.getTheme("nord"));
	});
});
