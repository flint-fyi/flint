import {
	parse,
	traverse,
	type AnyNode,
	type DocumentNode,
	type Node,
} from "@humanwhocodes/momoa";

import {
	createLanguage,
	groupFileVisitors,
	runFileVisitorSubscriptions,
	type Language,
} from "@flint.fyi/core";

import type { JsonNodesByName, JsonNodeVisitors } from "./nodes.ts";

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
			const { enter, exit } = groupFileVisitors<
				JsonNodesByName,
				JsonFileServices
			>(fileVisitors);

			traverse(file.services.root, {
				...(enter && {
					enter: (node: Node) => {
						// momoa's traverse types nodes as its base Node, but only visits AnyNode members.
						runFileVisitorSubscriptions(enter, node as AnyNode);
					},
				}),
				...(exit && {
					exit: (node: Node) => {
						// momoa's traverse types nodes as its base Node, but only visits AnyNode members.
						runFileVisitorSubscriptions(exit, node as AnyNode);
					},
				}),
			});
		},
	});
