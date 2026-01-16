import type { FileDiskData, LanguageFileDefinition } from "@flint.fyi/core";
import ts from "typescript";

import type { JsonFileServices } from "./language.ts";
import type { JsonNodesByName } from "./nodes.ts";

// TODO: Eventually, it might make sense to use a native speed JSON parser.
// The standard TypeScript language will likely use that itself.
// https://github.com/flint-fyi/flint/issues/44
export function createTypeScriptJsonFile(
	data: FileDiskData,
): LanguageFileDefinition<JsonNodesByName, JsonFileServices> {
	const sourceFile = ts.parseJsonText(data.filePathAbsolute, data.sourceText);

	return {
		about: data,
		runVisitors(options, runtime) {
			if (!runtime.visitors) {
				return;
			}

			const { visitors } = runtime;
			const fileServices = { options, sourceFile };

			const visit = (node: ts.Node) => {
				// @ts-expect-error -- This should work...?
				// eslint-disable-next-line @typescript-eslint/no-unsafe-call
				visitors[ts.SyntaxKind[node.kind]]?.(node, fileServices);
				node.forEachChild(visit);
			};

			sourceFile.forEachChild(visit);
		},
	};
}
