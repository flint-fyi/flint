import {
	parse,
	traverse,
	type DocumentNode,
	type Node,
} from "@humanwhocodes/momoa";

import {
	createLanguage,
	groupFileVisitors,
	runFileVisitorSubscriptions,
	type Language,
} from "@flint.fyi/core";

import type { JsonNodeVisitors } from "./nodes.ts";

export interface JsonFileServices {
	filePathAbsolute: string;
	root: DocumentNode;
	sourceText: string;
}

export const jsonLanguage: Language<JsonNodeVisitors, JsonFileServices> =
	createLanguage({
		about: {
			name: "JSON",
		},
		createFileFactory: () => {
			return {
				createFile: (data) => {
					const root = parse(data.sourceText, {
						mode: "json",
						ranges: true,
					});

					return {
						about: data,
						services: {
							filePathAbsolute: data.filePathAbsolute,
							root,
							sourceText: data.sourceText,
						},
					};
				},
			};
		},
		runFileVisitors: (file, fileVisitors) => {
			const { enter, exit } = groupFileVisitors<Node, JsonFileServices>(
				fileVisitors,
			);

			traverse(file.services.root, {
				...(enter && {
					enter: (node: Node) => {
						const entering = enter.get(node.type);
						if (entering !== undefined) {
							runFileVisitorSubscriptions(entering, node);
						}
					},
				}),
				...(exit && {
					exit: (node: Node) => {
						const exiting = exit.get(node.type);
						if (exiting !== undefined) {
							runFileVisitorSubscriptions(exiting, node);
						}
					},
				}),
			});
		},
	});
