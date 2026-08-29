import { parse, walk, type CssNode } from "css-tree";

import {
	createLanguage,
	groupFileVisitors,
	runFileVisitorSubscriptions,
	type Language,
} from "@flint.fyi/core";

import type { CssNodeVisitors } from "./nodes.ts";

export interface CssFileServices {
	root: CssNode;
	sourceText: string;
}

export const cssLanguage: Language<CssNodeVisitors, CssFileServices> =
	createLanguage({
		about: {
			name: "CSS",
		},
		createFileFactory: () => {
			return {
				createFile: (data) => {
					const root = parse(data.sourceText, {
						filename: data.filePath,
						parseRulePrelude: true,
						parseValue: true,
						positions: true,
					});

					return {
						about: data,
						services: { root, sourceText: data.sourceText },
					};
				},
			};
		},
		runFileVisitors: (file, fileVisitors) => {
			const { enter, exit } = groupFileVisitors<CssNode, CssFileServices>(
				fileVisitors,
			);

			walk(file.services.root, {
				...(enter && {
					enter: (node: CssNode) => {
						const entering = enter.get(node.type);
						if (entering !== undefined) {
							runFileVisitorSubscriptions(entering, node);
						}
					},
				}),
				...(exit && {
					leave: (node: CssNode) => {
						const exiting = exit.get(node.type);
						if (exiting !== undefined) {
							runFileVisitorSubscriptions(exiting, node);
						}
					},
				}),
			});
		},
	});
