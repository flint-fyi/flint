// @ts-check

import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineEcConfig } from "@astrojs/starlight/expressive-code";
import { transformerColorizedBrackets } from "@shikijs/colorized-brackets";
import ecTwoSlash from "expressive-code-twoslash";
import ts from "typescript";

export default defineEcConfig({
	plugins: [
		ecTwoSlash({
			twoslashOptions: {
				compilerOptions: {
					jsx: ts.JsxEmit.ReactJSX,
					jsxImportSource: "react",
					module: ts.ModuleKind.NodeNext,
					moduleResolution: ts.ModuleResolutionKind.NodeNext,
					noImplicitAny: false,
					target: ts.ScriptTarget.ESNext,
					// Override expressive-code-twoslash defaults which use friendly names
					// ("DOM", "ES2022") that don't work in the programmatic API — it needs
					// the file path format. esnext.full includes ES + DOM + DOM.Iterable.
					lib: ["lib.esnext.full.d.ts"],
				},
				tsLibDirectory: path.dirname(ts.getDefaultLibFilePath({})),
				vfsRoot: fileURLToPath(new URL("../..", import.meta.url)),
			},
		}),
	],
	shiki: {
		transformers: [
			transformerColorizedBrackets({
				// The package's night-owl presets, keyed by Starlight's bundled theme names.
				themes: {
					"Night Owl Light": [
						"#0431FA",
						"#319331",
						"#7B3814",
						"rgba(255, 18, 18, 0.8)",
					],
					"Night Owl No Italics": [
						"#FFD700",
						"#DA70D6",
						"#179FFF",
						"rgba(255, 18, 18, 0.8)",
					],
				},
			}),
		],
	},
});
