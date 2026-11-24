import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";

import { resolveTypeScriptPath, transformTscContent } from "./shared.ts";

const typescriptUrl = pathToFileURL(resolveTypeScriptPath()).href;

registerHooks({
	load(url, context, nextLoad) {
		const next = nextLoad(url, context);

		if (
			url !== typescriptUrl ||
			next.source == null ||
			(typeof next.source !== "string" && !(next.source instanceof Buffer))
		) {
			return next;
		}

		return {
			...next,
			source: transformTscContent(next.source.toString()),
		};
	},
});
