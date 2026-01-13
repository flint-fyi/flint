import { createLanguage } from "@flint.fyi/core";
import fsSync from "node:fs";
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
			prepareFromDisk: (data) => {
				const sourceText = fsSync.readFileSync(data.filePathAbsolute, "utf8");
				const { languageFile, root } = createYamlFile({ ...data, sourceText });

				return prepareYamlFile(languageFile, root, sourceText);
			},
			prepareFromVirtual: (data) => {
				const { languageFile, root } = createYamlFile(data);

				return prepareYamlFile(languageFile, root, data.sourceText);
			},
		};
	},
});
