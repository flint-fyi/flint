import { createLanguage } from "@flint.fyi/core";
import type * as ts from "typescript";

import { createTypeScriptJsonFile } from "./createJsonFile.ts";
import type { JsonNodesByName } from "./nodes.ts";

export interface JsonFileServices {
	sourceFile: ts.JsonSourceFile;
}

export const jsonLanguage = createLanguage<JsonNodesByName, JsonFileServices>({
	about: {
		name: "JSON",
	},
	createFileFactory: () => {
		return {
			prepareFile: (data) => {
				return {
					file: createTypeScriptJsonFile(data),
				};
			},
		};
	},
});
