declare module "@eslint-community/eslint-plugin-eslint-comments/configs" {
	import type { Linter } from "eslint";

	namespace Configs {
		import defaultExports = Configs;

		export const recommended: Linter.Config;

		export default defaultExports;
	}

	export = Configs;
}
