import type { UserConfig } from "tsdown";

export const base: UserConfig = {
	attw: {
		enabled: "ci-only",
		profile: "esm-only",
	},
	clean: ["./node_modules/.cache/tsbuild/"],
	entry: ["src/index.ts"],
	failOnWarn: true,
};
