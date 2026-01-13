// @ts-check

import ecTwoSlash from "expressive-code-twoslash";

/** @type {import('@astrojs/starlight/expressive-code').StarlightExpressiveCodeOptions} */
export default {
	plugins: [
		ecTwoSlash({
			twoslashOptions: {
				compilerOptions: {
					module: 199, // NodeNext
					moduleResolution: 99, // NodeNext
				},
			},
		}),
	],
};
