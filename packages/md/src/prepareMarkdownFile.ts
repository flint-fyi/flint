import type { LanguageFileDefinition } from "@flint.fyi/core";
import type { Root } from "mdast";

import { parseDirectivesFromMarkdownFile } from "./directives/parseDirectivesFromMarkdownFile.ts";
import type { MarkdownFileServices } from "./language.ts";
import type { MarkdownNodesByName } from "./nodes.ts";

export function prepareMarkdownFile(
	languageFile: LanguageFileDefinition<
		MarkdownNodesByName,
		MarkdownFileServices
	>,
	root: Root,
	sourceText: string,
) {
	return {
		...parseDirectivesFromMarkdownFile(root, sourceText),
		file: languageFile,
	};
}
