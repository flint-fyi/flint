import type { FileDiskData, LanguageFileDefinition } from "@flint.fyi/core";
import { visit } from "unist-util-visit";
import * as yamlParser from "yaml-unist-parser";

import type { YamlFileServices } from "./language.ts";
import type { YamlNodesByName } from "./nodes.ts";

// Eventually, it might make sense to use a native speed Yaml parser...
// However, the unist ecosystem is quite extensive and well-supported.
// It'll be a while before we can replace it with a native parser.
export function createYamlFile(data: FileDiskData) {
	const root = yamlParser.parse(data.sourceText);

	const languageFile: LanguageFileDefinition<
		YamlNodesByName,
		YamlFileServices
	> = {
		about: data,
		runVisitors(options, runtime) {
			if (!runtime.visitors) {
				return;
			}

			const { visitors } = runtime;
			const fileServices = { options, root, sourceText: data.sourceText };

			visit(root, (node) => {
				// @ts-expect-error -- This should work...?
				visitors[node.type]?.(node, fileServices);
			});
		},
	};

	return { languageFile, root };
}
