import type * as mdast from "mdast";
import { markdownToMdast } from "satteri";
import { visit } from "unist-util-visit";

import {
	createLanguage,
	groupFileVisitors,
	runFileVisitorSubscriptions,
	type Language,
} from "@flint.fyi/core";

import { parseDirectivesFromMarkdownFile } from "./directives/parseDirectivesFromMarkdownFile.ts";
import type {
	MarkdownNodesByName,
	MarkdownNodeVisitors,
	WithPosition,
} from "./nodes.ts";

export interface MarkdownFileServices {
	root: WithPosition<mdast.Root>;
	sourceText: string;
}

type MarkdownNode = MarkdownNodesByName[keyof MarkdownNodesByName];

export const markdownLanguage: Language<
	MarkdownNodeVisitors,
	MarkdownFileServices
> = createLanguage({
	about: {
		name: "Markdown",
	},
	createFileFactory: () => {
		return {
			createFile: (data) => {
				const root = markdownToMdast(
					data.sourceText,
				) as WithPosition<mdast.Root>;

				return {
					...parseDirectivesFromMarkdownFile(root, data.sourceText),
					about: data,
					services: { root, sourceText: data.sourceText },
				};
			},
		};
	},
	runFileVisitors: (file, fileVisitors) => {
		const { enter, exit } = groupFileVisitors<
			MarkdownNodesByName,
			MarkdownFileServices
		>(fileVisitors);

		visit(file.services.root, {
			enter(node) {
				if (enter) {
					// markdownToMdast sets positions with offsets on every node, as createFile assumes for the root.
					runFileVisitorSubscriptions(enter, node as MarkdownNode);
				}
			},
			exit(node) {
				if (exit) {
					// markdownToMdast sets positions with offsets on every node, as createFile assumes for the root.
					runFileVisitorSubscriptions(exit, node as MarkdownNode);
				}
			},
		});
	},
});
