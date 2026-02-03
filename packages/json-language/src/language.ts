import { createLanguage } from "@flint.fyi/core";
import * as ts from "typescript";

import type { JsonNodeVisitors } from "./nodes.ts";

export interface JsonFileServices {
	sourceFile: ts.JsonSourceFile;
}

export const jsonLanguage = createLanguage<JsonNodeVisitors, JsonFileServices>({
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
			const key = ts.SyntaxKind[node.kind] as keyof typeof visitors;

			visitors[key]?.(node, visitorServices);

			node.forEachChild(visit);

			visitors[`${key}:exit`]?.(node, visitorServices);
		};

		file.services.sourceFile.forEachChild(visit);
	},
});
