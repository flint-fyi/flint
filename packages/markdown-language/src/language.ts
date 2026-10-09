import type * as mdast from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { frontmatterFromMarkdown } from "mdast-util-frontmatter";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { frontmatter } from "micromark-extension-frontmatter";
import { gfm } from "micromark-extension-gfm";
import type { Node } from "unist";

import {
	createLanguage,
	groupFileVisitors,
	runFileVisitorSubscriptions,
	type Language,
} from "@flint.fyi/core";

import { parseDirectivesFromMarkdownFile } from "./directives/parseDirectivesFromMarkdownFile.ts";
import type { MarkdownNodeVisitors, WithPosition } from "./nodes.ts";

export interface MarkdownFileServices {
	root: WithPosition<mdast.Root>;
	sourceText: string;
}

export const markdownLanguage: Language<
	MarkdownNodeVisitors,
	MarkdownFileServices
> = createLanguage({
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
					extensions: [frontmatter(), gfm()],
					mdastExtensions: [frontmatterFromMarkdown(), gfmFromMarkdown()],
				}) as WithPosition<mdast.Root>;

				return {
					...parseDirectivesFromMarkdownFile(root, data.sourceText),
					about: data,
					services: { root, sourceText: data.sourceText },
				};
			},
		};
	},
	runFileVisitors: (file, fileVisitors) => {
		const { enter, exit } = groupFileVisitors<Node, MarkdownFileServices>(
			fileVisitors,
		);

		const visit = (node: Node) => {
			const entering = enter?.get(node.type);
			if (entering !== undefined) {
				runFileVisitorSubscriptions(entering, node);
			}

			if ("children" in node && Array.isArray(node.children)) {
				for (const child of node.children as Node[]) {
					visit(child);
				}
			}

			const exiting = exit?.get(node.type);
			if (exiting !== undefined) {
				runFileVisitorSubscriptions(exiting, node);
			}
		};

		visit(file.services.root);
	},
});
