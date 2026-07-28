import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
	createDiskBackedLinterHost,
	createLanguage,
	RuleCreator,
	type FileAboutData,
	type LintSession,
} from "@flint.fyi/core";
import { normalizePath } from "@flint.fyi/utils";

import { loadConfigDefinition } from "./loadConfigDefinition.ts";
import type { OptionsValues } from "./options.ts";
import type { Renderer, RendererContext } from "./renderers/types.ts";
import { runCliWatch } from "./runCliWatch.ts";

vi.mock("./loadConfigDefinition.ts", () => ({
	loadConfigDefinition: vi.fn(),
}));

type ProcessedConfigDefinition = Parameters<typeof LintSession.create>[0];

interface TestNodes {
	file: FileAboutData;
}

const tempDirectories: string[] = [];
const values = {
	"skip-formatting": true,
	watch: true,
} as OptionsValues;

describe(runCliWatch, () => {
	afterEach(async () => {
		vi.mocked(loadConfigDefinition).mockReset();
		await Promise.all(
			tempDirectories
				.splice(0)
				.map((directory) => rm(directory, { force: true, recursive: true })),
		);
	});

	it("reuses a lint session for ordinary file changes", async () => {
		const project = await createTestProject();
		vi.mocked(loadConfigDefinition).mockResolvedValue(project.configDefinition);
		const renderContexts: RendererContext[] = [];
		let quit: (() => void) | undefined;

		await runCliWatch(
			project.host,
			"flint.config.ts",
			() =>
				({
					announce: vi.fn(),
					onQuit(callback) {
						quit = callback;
					},
					async render(context) {
						renderContexts.push(context);

						if (renderContexts.length === 1) {
							await writeFile(project.aPath, "a2");
						} else {
							quit?.();
						}
					},
				}) satisfies Renderer,
			values,
		);

		expect(project.createFileFactory).toHaveBeenCalledTimes(1);
		expect(project.visitedFilePaths).toEqual([
			project.aPath,
			project.bPath,
			project.aPath,
		]);
		expect(renderContexts).toHaveLength(2);
		expect(renderContexts[1]?.lintResults.allFileResults.size).toBe(2);
	});

	it("rebuilds the lint session after a file is added", async () => {
		const project = await createTestProject();
		vi.mocked(loadConfigDefinition).mockResolvedValue(project.configDefinition);
		let quit: (() => void) | undefined;
		let renderCount = 0;
		let finalFileCount = 0;

		await runCliWatch(
			project.host,
			"flint.config.ts",
			() =>
				({
					announce: vi.fn(),
					onQuit(callback) {
						quit = callback;
					},
					async render(context) {
						renderCount += 1;
						finalFileCount = context.lintResults.allFileResults.size;

						if (renderCount === 1) {
							await writeFile(path.join(project.root, "c.txt"), "c1");
						} else {
							quit?.();
						}
					},
				}) satisfies Renderer,
			values,
		);

		expect(project.createFileFactory).toHaveBeenCalledTimes(2);
		expect(loadConfigDefinition).toHaveBeenCalledTimes(2);
		expect(finalFileCount).toBe(3);
	});

	it("rebuilds the lint session after a structural file changes", async () => {
		const project = await createTestProject();
		vi.mocked(loadConfigDefinition).mockResolvedValue(project.configDefinition);
		let quit: (() => void) | undefined;
		let renderCount = 0;

		await runCliWatch(
			project.host,
			"flint.config.ts",
			() =>
				({
					announce: vi.fn(),
					onQuit(callback) {
						quit = callback;
					},
					async render() {
						renderCount += 1;

						if (renderCount === 1) {
							await writeFile(path.join(project.root, "package.json"), "{}");
						} else {
							quit?.();
						}
					},
				}) satisfies Renderer,
			values,
		);

		expect(loadConfigDefinition).toHaveBeenCalledTimes(2);
		expect(renderCount).toBe(2);
	});

	it("applies fixes and re-lints changed files", async () => {
		const project = await createTestProject({ fixText: "fixed" });
		vi.mocked(loadConfigDefinition).mockResolvedValue(project.configDefinition);
		let quit: (() => void) | undefined;

		await runCliWatch(
			project.host,
			"flint.config.ts",
			() =>
				({
					announce: vi.fn(),
					onQuit(callback) {
						quit = callback;
					},
					render() {
						quit?.();
						return Promise.resolve();
					},
				}) satisfies Renderer,
			{ ...values, fix: true },
		);

		expect(await readFile(project.aPath, "utf8")).toBe("fixed");
		expect(project.visitedFilePaths).toEqual([
			project.aPath,
			project.bPath,
			project.aPath,
		]);
	});
});

async function createTestProject({ fixText }: { fixText?: string } = {}) {
	const root = normalizePath(
		await mkdtemp(path.join(os.tmpdir(), "flint-cli-watch-")),
	);
	tempDirectories.push(root);

	const aPath = path.posix.join(root, "a.txt");
	const bPath = path.posix.join(root, "b.txt");
	await writeFile(aPath, "a1");
	await writeFile(bPath, "b1");

	const host = createDiskBackedLinterHost(root);
	const visitedFilePaths: string[] = [];
	const createFileFactory = vi.fn(() => ({
		createFile(data: FileAboutData) {
			return {
				about: data,
				services: {},
			};
		},
	}));
	const language = createLanguage<TestNodes>({
		about: { name: "Test" },
		createFileFactory,
		runFileVisitors(file, options, runtime) {
			runtime.visitors?.file?.(file.about, {
				options,
				...file.services,
			});
		},
	});
	const rule = new RuleCreator({
		docs: (ruleId) => `https://example.com/${ruleId}`,
		pluginId: "test",
		presets: [],
	}).createRule(language, {
		about: {
			description: "Test.",
			id: "test",
		},
		messages: {
			found: {
				primary: "Found.",
				secondary: [],
				suggestions: [],
			},
		},
		setup(context) {
			return {
				visitors: {
					file(file) {
						visitedFilePaths.push(file.filePath);
						if (
							fixText &&
							file.filePath === aPath &&
							file.sourceText !== fixText
						) {
							context.report({
								fix: {
									range: { begin: 0, end: file.sourceText.length },
									text: fixText,
								},
								message: "found",
								range: { begin: 0, end: file.sourceText.length },
							});
						}
					},
				},
			};
		},
	});
	const configDefinition: ProcessedConfigDefinition = {
		filePath: "flint.config.ts",
		use: [
			{
				files: ["*.txt"],
				rules: [rule],
			},
		],
	};

	return {
		aPath,
		bPath,
		configDefinition,
		createFileFactory,
		host,
		root,
		visitedFilePaths,
	};
}
