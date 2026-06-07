import { parse, walk, type CssNode } from "css-tree";

import { createLanguage, type Language } from "@flint.fyi/core";

import type { CssNodeVisitors } from "./nodes.ts";

export interface CssFileServices {
	root: CssNode;
	sourceText: string;
}

export const cssLanguage: Language<CssNodeVisitors, CssFileServices> =
	createLanguage<CssNodeVisitors, CssFileServices>({
		about: {
			name: "CSS",
		},
		createFileFactory: () => {
			return {
				createFile: (data) => {
					const root = parse(data.sourceText, {
						filename: data.filePath,
						parseRulePrelude: true,
						parseValue: true,
						positions: true,
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

			walk(file.services.root, {
				// @ts-expect-error -- The intersection AnPlusB & Atrule & AtrulePrelude &...was reduced to `never` because property `type` has conflicting types in some constituents.
				enter: (node: CssNode) => visitors[node.type]?.(node, visitorServices),
				leave: (node: CssNode) =>
					// @ts-expect-error -- The intersection AnPlusB & Atrule & AtrulePrelude &...was reduced to `never` because property `type` has conflicting types in some constituents.
					visitors[`${node.type}:exit`]?.(node, visitorServices),
			});
		},
	});
