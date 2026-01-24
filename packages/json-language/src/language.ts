import { createLanguage } from "@flint.fyi/core";
import * as ts from "typescript";

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
			createFile: (data) => {
				const sourceFile = ts.parseJsonText(
					data.filePathAbsolute,
					data.sourceText,
				);

				return {
					about: data,
					services: { sourceFile },
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

		const visit = (node: ts.Node) => {
			// @ts-expect-error -- This should work...?
			// eslint-disable-next-line @typescript-eslint/no-unsafe-call
			visitors[ts.SyntaxKind[node.kind]]?.(node, visitorServices);
			node.forEachChild(visit);
		};

		file.services.sourceFile.forEachChild(visit);
	},
});
