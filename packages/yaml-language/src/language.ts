import { createLanguage } from "@flint.fyi/core";
import { visit } from "unist-util-visit";
import * as yamlParser from "yaml-unist-parser";

import { parseDirectivesFromYamlFile } from "./directives/parseDirectivesFromYamlFile.ts";
import type { YamlNodesByName } from "./nodes.ts";

export interface YamlFileServices {
	root: yamlParser.Root;
	sourceText: string;
}

export const yamlLanguage = createLanguage<YamlNodesByName, YamlFileServices>({
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

		visit(
			file.services.root,
			(node) => {
				// @ts-expect-error -- This should work...?
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				visitors[node.type]?.(node, visitorServices);
			},
			(node) => {
				// @ts-expect-error -- This should work...?
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				visitors[`${node.type}:exit`]?.(node, visitorServices);
			},
		);
	},
});
