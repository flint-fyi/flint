import type { UserConfig } from "tsdown";
import ApiSnapshot from "tsnapi/rolldown";

export const base: UserConfig = {
	attw: {
		enabled: "ci-only",
		profile: "esm-only",
	},
	clean: ["./node_modules/.cache/tsbuild/"],
	dts: { build: true, incremental: true },
	entry: ["src/index.ts"],
	exports: {
		devExports: true,
		packageJson: false,
	},
	failOnWarn: true,
	plugins: [ApiSnapshot()],
};
