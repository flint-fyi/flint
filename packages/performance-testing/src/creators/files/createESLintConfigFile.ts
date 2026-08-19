import type { TestCaseRules } from "../../testCases.ts";
import { comparedRules } from "./rules.ts";

interface PluginPackage {
	alias: string;
	specifier: string;
}

// typescript-eslint's base config already registers this one.
const preregisteredPlugin = "@typescript-eslint";

const pluginPackages = new Map<string, PluginPackage>([
	["import", { alias: "importPlugin", specifier: "eslint-plugin-import" }],
	["regexp", { alias: "regexp", specifier: "eslint-plugin-regexp" }],
	["unicorn", { alias: "unicorn", specifier: "eslint-plugin-unicorn" }],
]);

export function createESLintConfigFile(rules: TestCaseRules): string {
	const enabled = comparedRules[rules];
	const used = new Map<string, PluginPackage>();

	for (const { eslint } of enabled) {
		const pluginName = getPluginName(eslint);

		if (pluginName === undefined || pluginName === preregisteredPlugin) {
			continue;
		}

		const pluginPackage = pluginPackages.get(pluginName);

		if (!pluginPackage) {
			throw new Error(`No ESLint plugin package is known for ${eslint}.`);
		}

		used.set(pluginName, pluginPackage);
	}

	const plugins = Array.from(used, ([name, pluginPackage]) => ({
		...pluginPackage,
		name,
	})).sort((a, b) => a.name.localeCompare(b.name));

	return `
import { defineConfig, globalIgnores } from "eslint/config";
${plugins.map(({ alias, specifier }) => `import ${alias} from "${specifier}";`).join("\n")}
import tseslint from "typescript-eslint";

export default defineConfig(
	globalIgnores(["node_modules", "*.config.*"]),
	tseslint.configs.base,
	{
		files: ["src/**/*.ts"],
		languageOptions: {
			parserOptions: {
				projectService: true,
			},
		},
		plugins: {
			${plugins.map(({ alias, name }) => `"${name}": ${alias}`).join(",\n")}
		},
		rules: {
			${enabled.map(({ eslint }) => `"${eslint}": "error"`).join(",\n")}
		},
	},
);
`;
}

function getPluginName(ruleName: string) {
	const separator = ruleName.indexOf("/");

	return separator === -1 ? undefined : ruleName.slice(0, separator);
}
