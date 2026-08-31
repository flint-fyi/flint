import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { createVFSLinterHost } from "../host/createVFSLinterHost.ts";
import { createLanguage } from "../languages/createLanguage.ts";
import { RuleCreator } from "../rules/RuleCreator.ts";
import type { ProcessedConfigDefinition } from "../types/configs.ts";
import type { FileAboutData } from "../types/languages.ts";
import type { RuleRuntime } from "../types/rules.ts";
import { runConfig } from "./runConfig.ts";

interface TestNodes {
	Root: FileAboutData;
}

interface TestServices {
	generation: number;
}

describe(runConfig, () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("keeps re-linted results for cached files required by a rule", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(1000);
		const project = createTestProject({ requiresAllFiles: true });

		const firstResults = await runConfig(
			project.configDefinition,
			project.host,
			{},
		);
		const firstBReports = firstResults.allFileResults.get(
			project.bPath,
		)?.languageReports;

		vi.setSystemTime(2000);
		project.host.vfsUpsertFile(project.aPath, "a2");

		const secondResults = await runConfig(
			project.configDefinition,
			project.host,
			{},
		);

		expect(secondResults.cached).toEqual(new Map());
		expect(
			secondResults.allFileResults.get(project.bPath)?.languageReports,
		).not.toEqual(firstBReports);
	});

	it("counts only rules with matched files", async () => {
		const project = createTestProject({ includeUnmatchedRule: true });

		const results = await runConfig(project.configDefinition, project.host, {
			ignoreCache: true,
		});

		expect(results.ruleCount).toBe(1);
	});
});

function createTestProject({
	includeUnmatchedRule,
	requiresAllFiles,
}: {
	includeUnmatchedRule?: boolean;
	requiresAllFiles?: boolean;
} = {}) {
	const root = "/root";
	const aPath = path.posix.join(root, "a.txt");
	const bPath = path.posix.join(root, "b.txt");
	const configFilePath = path.posix.join(root, "flint.config.ts");
	const host = createVFSLinterHost({ caseSensitive: true, cwd: root });
	host.vfsUpsertFile(aPath, "a1");
	host.vfsUpsertFile(bPath, "b1");
	host.vfsUpsertFile(configFilePath, "");
	host.vfsUpsertFile("package.json", "{}");

	let generation = 0;
	const language = createLanguage<TestNodes, TestServices>({
		about: { name: "Test" },
		createFileFactory: () => ({
			createFile(data) {
				return {
					about: data,
					services: { generation: (generation += 1) },
				};
			},
		}),
		getLanguageReports(file) {
			return [{ text: file.services.generation.toString() }];
		},
		runFileVisitors(file, options, runtime) {
			(
				runtime as RuleRuntime<TestNodes, TestServices & { options: object }>
			).visitors?.Root?.(file.about, {
				options: options ?? {},
				...file.services,
			});
		},
	});
	const ruleCreator = new RuleCreator({
		docs: (ruleId) => `https://example.com/rules/${ruleId}`,
		pluginId: "test",
		presets: [],
	});
	const matchedRule = ruleCreator.createRule(language, {
		about: { description: "Matched test rule.", id: "matched" },
		messages: {},
		...(requiresAllFiles && { requiresAllFiles }),
		setup() {
			return;
		},
	});
	const unmatchedRule = ruleCreator.createRule(language, {
		about: { description: "Unmatched test rule.", id: "unmatched" },
		messages: {},
		setup() {
			return;
		},
	});
	const configDefinition: ProcessedConfigDefinition = {
		filePath: configFilePath,
		use: [
			{ files: ["*.txt"], rules: [matchedRule] },
			...(includeUnmatchedRule
				? [{ files: ["*.missing"], rules: [unmatchedRule] }]
				: []),
		],
	};

	return { aPath, bPath, configDefinition, host };
}
