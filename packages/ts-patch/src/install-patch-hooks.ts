import { registerHooks } from "node:module";

import { transformTscContent } from "./shared.ts";

const typescriptUrl = import.meta.resolve("typescript");

registerHooks({
	load(url, context, nextLoad) {
		const next = nextLoad(url, context);

		if (
			url !== typescriptUrl ||
			next.source == null ||
			!(next.source instanceof Buffer)
		) {
			return next;
		}

		return {
			...next,
			source: transformTscContent(next.source.toString()),
		};
	},
});
