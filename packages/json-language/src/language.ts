import {
	parse,
	traverse,
	type AnyNode,
	type DocumentNode,
	type Node,
} from "@humanwhocodes/momoa";

import { createLanguage, type Language } from "@flint.fyi/core";

import type { JsonNodeVisitors } from "./nodes.ts";

export interface JsonFileServices {
	root: DocumentNode;
	sourceText: string;
}

export const jsonLanguage: Language<JsonNodeVisitors, JsonFileServices> =
	createLanguage<JsonNodeVisitors, JsonFileServices>({
		about: {
			name: "JSON",
		},
		createFileFactory: () => {
			return {
				createFile: (data) => {
					const root = parse(data.sourceText, {
						mode: "json",
						ranges: true,
					});

					return {
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

			traverse(file.services.root, {
				enter: (node: Node) =>
					// @ts-expect-error -- The intersection DocumentNode & ArrayNode &...was reduced to `never` because property `type` has conflicting types in some constituents.
					visitors[node.type as AnyNode["type"]]?.(node, visitorServices),
				exit: (node: Node) =>
					visitors[`${node.type as AnyNode["type"]}:exit`]?.(
						// @ts-expect-error -- Argument of type `Node` is not assignable to parameter of type `undefined`
						node,
						visitorServices,
					),
			});
		},
	});
