// @ts-check

import { fileURLToPath } from "node:url";

import { defineEcConfig } from "@astrojs/starlight/expressive-code";
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
				vfsRoot: fileURLToPath(new URL("../..", import.meta.url)),
			},
		}),
	],
});
