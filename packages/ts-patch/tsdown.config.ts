import { defineConfig } from "tsdown";

import { base } from "@flint.fyi/build/tsdown";

export default defineConfig({
	...base,
	entry: ["src/index.ts", "src/install-patch.ts", "src/install-patch-hooks.ts"],
	treeshake: false,
});
