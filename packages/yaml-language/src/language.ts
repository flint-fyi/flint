import { createLanguage } from "@flint.fyi/core";
import * as yamlParser from "yaml-unist-parser";

import { parseDirectivesFromYamlFile } from "./directives/parseDirectivesFromYamlFile.ts";
import type { YamlNodesByName, YamlNodeVisitors } from "./nodes.ts";

export interface YamlFileServices {
	root: yamlParser.Root;
	sourceText: string;
}

export const yamlLanguage = createLanguage<YamlNodeVisitors, YamlFileServices>({
	about: {
		name: "YAML",
	},
	createFileFactory: () => {
		return {
			createFile: (data) => {
				const root = yamlParser.parse(data.sourceText);

				return {
					...parseDirectivesFromYamlFile(root, data.sourceText),
					about: data,
					services: { root, sourceText: data.sourceText },
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

		const visit = (node: yamlParser.Node) => {
			const key = node.type as keyof YamlNodesByName;

			// @ts-expect-error -- The node parameter type shouldn't be `never`...?
			visitors[key]?.(node, visitorServices);

			if ("children" in node && Array.isArray(node.children)) {
				for (const child of node.children as yamlParser.Node[]) {
					visit(child);
				}
			}

			// @ts-expect-error -- The node parameter type shouldn't be `never`...?
			visitors[`${key}:exit`]?.(node, visitorServices);
		};

		visit(file.services.root);
	},
});
