import { registerHooks } from "node:module";

import { transformTscContent } from "./shared.ts";

const typescriptUrl = import.meta.resolve("typescript");

registerHooks({
	load(url, context, nextLoad) {
		const next = nextLoad(url, context);

		if (url !== typescriptUrl || next.source == null) {
			return next;
		}

		// Node hands ESM loads a Buffer and `require()` loads a string.
		const source =
			typeof next.source === "string"
				? next.source
				: new TextDecoder().decode(next.source);

		return {
			...next,
			source: transformTscContent(source),
		};
	},
});
