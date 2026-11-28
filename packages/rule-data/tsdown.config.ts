import { defineConfig, type UserConfig } from "tsdown";
import Macros from "unplugin-macros/rolldown";

import { base } from "@flint.fyi/build/tsdown";

const config: UserConfig = defineConfig({
	...base,
	plugins: [Macros()],
});

export default config;
