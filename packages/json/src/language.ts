import { createLanguage } from "@flint.fyi/core";
import fsSync from "node:fs";
import type * as ts from "typescript";

import { createTypeScriptJsonFile } from "./createJsonFile.ts";
import type { JsonNodesByName } from "./nodes.ts";

export interface JsonFileServices {
	sourceFile: ts.JsonSourceFile;
}

// TODO: It would be nice to limit JsonNodesByName to just nodes in JSON files...
// https://github.com/flint-fyi/flint/issues/1294
export const jsonLanguage = createLanguage<JsonNodesByName, JsonFileServices>({
	about: {
		name: "JSON",
	},
	createFileFactory: () => {
		return {
			prepareFromDisk: (data) => {
				return {
					file: createTypeScriptJsonFile({
						...data,
						sourceText: fsSync.readFileSync(data.filePathAbsolute, "utf8"),
					}),
				};
			},
			prepareFromVirtual: (data) => {
				return {
					file: createTypeScriptJsonFile(data),
				};
			},
		};
	},
});
