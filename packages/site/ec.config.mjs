// @ts-check

import { fileURLToPath } from "node:url";

import ecTwoSlash from "expressive-code-twoslash";

/** @type {import('@astrojs/starlight/expressive-code').StarlightExpressiveCodeOptions} */
export default {
	plugins: [
		ecTwoSlash({
			twoslashOptions: {
				vfsRoot: fileURLToPath(new URL("../..", import.meta.url)),
				compilerOptions: {
					target: 99, // ESNext
					module: 199, // NodeNext
					moduleResolution: 99, // NodeNext
					jsx: 4, // react-jsx
					jsxImportSource: "react",
					noImplicitAny: false,
					// Override expressive-code-twoslash defaults which use friendly names
					// ("DOM", "ES2022") that don't work in the programmatic API — it needs
					// the file path format. esnext.full includes ES + DOM + DOM.Iterable.
					lib: ["lib.esnext.full.d.ts"],
				},
			},
		}),
	],
};
