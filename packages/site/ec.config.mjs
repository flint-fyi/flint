// @ts-check

import ecTwoSlash from "expressive-code-twoslash";

/** @type {import('@astrojs/starlight/expressive-code').StarlightExpressiveCodeOptions} */
export default {
	plugins: [
		ecTwoSlash({
			explicitTrigger: false,
			twoslashOptions: {
				compilerOptions: {
					module: 199, // NodeNext
					moduleResolution: 99, // NodeNext
					jsx: 4, // react-jsx
					jsxImportSource: "react",
					noImplicitAny: false,
				},
			},
		}),
	],
};
