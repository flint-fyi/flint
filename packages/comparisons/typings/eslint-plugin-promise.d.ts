// Pending: https://github.com/eslint-community/eslint-plugin-promise/issues/488
declare module "eslint-plugin-promise" {
	import type { Linter, Rule } from "eslint";

	const plugin: {
		configs: Record<string, Linter.Config>;
		rules: Record<string, Rule.RuleModule>;
		rulesConfig: Record<string, Linter.RuleSeverity>;
	};

	export default plugin;
}
