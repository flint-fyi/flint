import type * as mdast from "mdast";
import { markdownToMdast } from "satteri";
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
