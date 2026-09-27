declare module "@eslint-community/eslint-plugin-eslint-comments/configs" {
	import type { Linter } from "eslint";

	namespace Configs {
		import defaultExports = Configs;

		export const recommended: Linter.Config;

		// eslint-disable-next-line unicorn/no-named-default -- TypeScript 7 disallows `export default` inside namespaces
		export { defaultExports as default };
	}

	export = Configs;
}
