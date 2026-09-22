import {
	createHighlighterCore,
	type CodeToTokensBaseOptions,
	type HighlighterCore,
	type ThemedToken,
} from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";
import typescript from "shiki/langs/typescript.mjs";
import nord from "shiki/themes/nord.mjs";

let highlighter: Promise<HighlighterCore> | undefined;

export async function codeToTokensBase(
	code: string,
	options: CodeToTokensBaseOptions,
): Promise<ThemedToken[][]> {
	return (await getSingletonHighlighter()).codeToTokensBase(code, options);
}

export function getSingletonHighlighter(): Promise<HighlighterCore> {
	return (highlighter ??= createHighlighterCore({
		engine: createOnigurumaEngine(import("shiki/wasm")),
		langs: [typescript],
		themes: [nord],
	}));
}
