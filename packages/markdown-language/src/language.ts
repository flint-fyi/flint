import { createLanguage } from "@flint.fyi/core";
import type * as mdast from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { gfm } from "micromark-extension-gfm";
import type { Node } from "unist";

import { parseDirectivesFromMarkdownFile } from "./directives/parseDirectivesFromMarkdownFile.ts";
import type {
	MarkdownNodesByName,
	MarkdownNodeVisitors,
	WithPosition,
} from "./nodes.ts";

export interface MarkdownFileServices {
	root: WithPosition<mdast.Root>;
}

export const markdownLanguage = createLanguage<
	MarkdownNodeVisitors,
	MarkdownFileServices
>({
	about: {
		name: "Markdown",
	},
	createFileFactory: () => {
		return {
			// Eventually, it might make sense to use markdown-rs...
			// However, there aren't currently JS bindings, so
			// it'll be a while before we can replace it with a native parser.
			// See the discussion in https://github.com/flint-fyi/flint/issues/1043.
			createFile: (data) => {
				const root = fromMarkdown(data.sourceText, {
					extensions: [gfm()],
					mdastExtensions: [gfmFromMarkdown()],
				}) as WithPosition<mdast.Root>;

				return {
					...parseDirectivesFromMarkdownFile(root, data.sourceText),
					about: data,
					services: { root },
				};
			},
		};
	},
	runFileVisitors: (file, options, runtime) => {
		if (!runtime.visitors) {
			return;
		}

		const { visitors } = runtime;
		const visitorServices = { options, ...file.services };

		const visit = (node: Node) => {
			const key = node.type as keyof MarkdownNodesByName;

			// @ts-expect-error -- The node parameter type shouldn't be `never`...?
			visitors[key]?.(node, visitorServices);

			if ("children" in node && Array.isArray(node.children)) {
				for (const child of node.children as Node[]) {
					visit(child);
				}
			}

			// @ts-expect-error -- The node parameter type shouldn't be `never`...?
			visitors[`${key}:exit`]?.(node, visitorServices);
		};

		visit(file.services.root);
	},
});
