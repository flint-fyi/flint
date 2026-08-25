import { parse, type Node, type Root } from "yaml-unist-parser";

import { createLanguage, type Language } from "@flint.fyi/core";

import { parseDirectivesFromYamlFile } from "./directives/parseDirectivesFromYamlFile.ts";
import type { YamlNodesByName, YamlNodeVisitors } from "./nodes.ts";

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
		runFileVisitors: (file, options, runtime) => {
			if (!runtime.visitors) {
				return;
			}

			const { visitors } = runtime;
			const visitorServices = { options, ...file.services };

			const visit = (node: Node) => {
				const key = node.type as keyof YamlNodesByName;

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
