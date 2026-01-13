import type { FileDiskData, LanguageFileDefinition } from "@flint.fyi/core";
import { fromMarkdown } from "mdast-util-from-markdown";
import { visit } from "unist-util-visit";

import type { MarkdownFileServices } from "./language.ts";
import type { MarkdownNodesByName } from "./nodes.ts";

// Eventually, it might make sense to use markdown-rs...
// However, there aren't currently JS bindings, so
// it'll be a while before we can replace it with a native parser.
// See the discussion in https://github.com/flint-fyi/flint/issues/1043.
export function createMarkdownFile(data: FileDiskData) {
	const root = fromMarkdown(data.sourceText);

	const languageFile: LanguageFileDefinition<
		MarkdownNodesByName,
		MarkdownFileServices
	> = {
		about: data,
		runVisitors(options, runtime) {
			if (!runtime.visitors) {
				return;
			}

			const { visitors } = runtime;
			const fileServices = { options, root };

			visit(root, (node) => {
				// @ts-expect-error -- This should work...?
				visitors[node.type]?.(node, fileServices);
			});
		},
	};

	return { languageFile, root };
}
