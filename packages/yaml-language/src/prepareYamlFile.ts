import type { LanguageFileDefinition } from "@flint.fyi/core";
import type * as yamlParser from "yaml-unist-parser";

import { parseDirectivesFromYamlFile } from "./directives/parseDirectivesFromYamlFile.ts";
import type { YamlFileServices } from "./language.ts";
import type { YamlNodesByName } from "./nodes.ts";

export function prepareYamlFile(
	languageFile: LanguageFileDefinition<YamlNodesByName, YamlFileServices>,
	root: yamlParser.Root,
	sourceText: string,
) {
	return {
		...parseDirectivesFromYamlFile(root, sourceText),
		file: languageFile,
	};
}
