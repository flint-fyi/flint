import { comparisons, type LinterRuleReference } from "./index.ts";

interface GroupedComparisons {
	eslint: Record<
		MaybeLiteral<"builtin">, // pluginName
		Record<
			string, // ruleName
			LinterRuleReference[] | undefined
		>
	>;
}

type MaybeLiteral<T extends string> = (string & {}) | T;

export function groupByLinterAndPlugin(
	comp: typeof comparisons,
): GroupedComparisons {
	const eslint: GroupedComparisons["eslint"] = {
		builtin: {},
	};

	for (const comparison of comp) {
		for (const rule of comparison.eslint ?? []) {
			const [plugin, ruleName] = extractESLintRuleMeta(rule);
			eslint[plugin] ??= {};
			eslint[plugin][ruleName] = comparison.eslint;
		}
	}

	return { eslint };
}

function extractESLintRuleMeta(
	rule: LinterRuleReference,
): [plugin: MaybeLiteral<"builtin">, ruleName: string] {
	if (rule.url.startsWith("https://eslint.org/docs")) {
		return ["builtin", rule.name];
	}

	const [plugin, ruleName] = rule.name.split("/");
	if (
		!plugin
		// After adding a prefix to all non-builtin rules, this check can be enabled
		// || !ruleName
	) {
		throw new Error(`Could not extract plugin and rule name from ${rule.name}`);
	}

	return [
		plugin,
		// After adding a prefix to all non-builtin rules, remove the coalesce.
		ruleName ?? "",
	];
}
