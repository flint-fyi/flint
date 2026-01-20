import { createLanguage } from "@flint.fyi/core";
import type * as yamlParser from "yaml-unist-parser";

import { createYamlFile } from "./createYamlFile.ts";
import type { YamlNodesByName } from "./nodes.ts";
import { prepareYamlFile } from "./prepareYamlFile.ts";

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
			prepareFile: (data) => {
				const { languageFile, root } = createYamlFile(data);

				return prepareYamlFile(languageFile, root, data.sourceText);
			},
		};
	},
});
