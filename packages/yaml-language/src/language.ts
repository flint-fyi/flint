import { parse, type Node, type Root } from "yaml-unist-parser";

import {
	createLanguage,
	groupFileVisitors,
	runFileVisitorSubscriptions,
	type Language,
} from "@flint.fyi/core";

import { parseDirectivesFromYamlFile } from "./directives/parseDirectivesFromYamlFile.ts";
import type { YamlNodeVisitors } from "./nodes.ts";

export interface YamlFileServices {
	filePath: string;
	root: Root;
	sourceText: string;
}

export const yamlLanguage: Language<YamlNodeVisitors, YamlFileServices> =
	createLanguage({
		about: {
			name: "YAML",
		},
		createFileFactory: () => {
			return {
				createFile: (data) => {
					const root = parse(data.sourceText);

					return {
						...parseDirectivesFromYamlFile(root, data.sourceText),
						about: data,
						services: {
							filePath: data.filePath,
							root,
							sourceText: data.sourceText,
						},
					};
				},
			};
		},
		runFileVisitors: (file, fileVisitors) => {
			const { enter, exit } = groupFileVisitors<Node, YamlFileServices>(
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
