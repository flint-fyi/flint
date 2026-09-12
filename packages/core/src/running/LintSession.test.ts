import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { normalizePath } from "@flint.fyi/utils";

import { createDiskBackedLinterHost } from "../host/createDiskBackedLinterHost.ts";
import { createLanguage } from "../languages/createLanguage.ts";
import { RuleCreator } from "../rules/RuleCreator.ts";
import type { ProcessedConfigDefinition } from "../types/configs.ts";
import type { FileAboutData } from "../types/languages.ts";
import { LintSession } from "./LintSession.ts";

interface TestNodes {
	Root: { filePath: string };
}

interface TestServices {
	sourceText: string;
}

const tempDirectories: string[] = [];

describe(LintSession, () => {
	afterEach(async () => {
		await Promise.all(
			tempDirectories
				.splice(0)
				.map((dir) => rm(dir, { force: true, recursive: true })),
		);
	});

	it("reuses language factories across repeated subset linting", async () => {
		const { configDefinition, createFileFactory, host, root } =
			await createTestProject();
		using session = await LintSession.create(configDefinition, host);

		await session.lintFiles([path.posix.join(root, "a.txt")]);
		await session.lintFiles([path.posix.join(root, "b.txt")]);

		expect(createFileFactory).toHaveBeenCalledTimes(1);
	});

	it("only replaces stored results for requested files", async () => {
		const { configDefinition, host, root } = await createTestProject();
		using session = await LintSession.create(configDefinition, host);
		const aPath = path.posix.join(root, "a.txt");
		const bPath = path.posix.join(root, "b.txt");

		await session.lintAll();
		await writeFile(aPath, "a2");

		const results = await session.lintFiles([aPath]);

		expect(Array.from(results.keys())).toEqual([aPath]);
		expect(session.storedResults.get(aPath)?.languageReports).toEqual([
			{ text: "a2" },
		]);
		expect(session.storedResults.get(bPath)?.languageReports).toEqual([
			{ text: "b1" },
		]);
	});

	it("orders file creation through the language", async () => {
		const orderedCreatedFilePaths: string[] = [];
		const orderFilePaths = vi.fn((filePaths: readonly string[]) =>
			[...filePaths].reverse(),
		);
		const { configDefinition, host, root } = await createTestProject({
			orderedCreatedFilePaths,
			orderFilePaths,
		});
		using session = await LintSession.create(configDefinition, host);
		const aPath = path.posix.join(root, "a.txt");
		const bPath = path.posix.join(root, "b.txt");
		const cPath = path.posix.join(root, "c.txt");

		await session.lintFiles([aPath, bPath, cPath]);

		expect(orderFilePaths).toHaveBeenCalledWith([aPath, bPath, cPath], host);
		expect(orderedCreatedFilePaths).toEqual([cPath, bPath, aPath]);
	});

	it("lints transitive dependents through multi-hop dependency chains", async () => {
		const { configDefinition, dependenciesByFilePath, host, root } =
			await createTestProject();
		const aPath = path.posix.join(root, "a.txt");
		const bPath = path.posix.join(root, "b.txt");
		const cPath = path.posix.join(root, "c.txt");
		dependenciesByFilePath.set(aPath, [bPath]);
		dependenciesByFilePath.set(bPath, [cPath]);
		using session = await LintSession.create(configDefinition, host);

		await session.lintAll();

		expect(lintedFileNames(await session.lintChangedFiles([cPath]))).toEqual(
			new Set(["a.txt", "b.txt", "c.txt"]),
		);
		expect(lintedFileNames(await session.lintChangedFiles([bPath]))).toEqual(
			new Set(["a.txt", "b.txt"]),
		);
		expect(lintedFileNames(await session.lintChangedFiles([aPath]))).toEqual(
			new Set(["a.txt"]),
		);
	});

	it("lints every file in a dependency cycle once", async () => {
		const { configDefinition, dependenciesByFilePath, host, root } =
			await createTestProject();
		const aPath = path.posix.join(root, "a.txt");
		const bPath = path.posix.join(root, "b.txt");
		const cPath = path.posix.join(root, "c.txt");
		dependenciesByFilePath.set(aPath, [bPath]);
		dependenciesByFilePath.set(bPath, [cPath]);
		dependenciesByFilePath.set(cPath, [aPath]);
		using session = await LintSession.create(configDefinition, host);

		await session.lintAll();

		expect(lintedFileNames(await session.lintChangedFiles([cPath]))).toEqual(
			new Set(["a.txt", "b.txt", "c.txt"]),
		);
	});

	it("lints exactly the requested files with lintFiles", async () => {
		const { configDefinition, dependenciesByFilePath, host, root } =
			await createTestProject();
		const aPath = path.posix.join(root, "a.txt");
		const bPath = path.posix.join(root, "b.txt");
		dependenciesByFilePath.set(aPath, [bPath]);
		using session = await LintSession.create(configDefinition, host);

		await session.lintAll();

		expect(lintedFileNames(await session.lintFiles([bPath]))).toEqual(
			new Set(["b.txt"]),
		);
	});

	it("reports changed files before their dependents", async () => {
		const { configDefinition, dependenciesByFilePath, host, root } =
			await createTestProject();
		const aPath = path.posix.join(root, "a.txt");
		const bPath = path.posix.join(root, "b.txt");
		const cPath = path.posix.join(root, "c.txt");
		dependenciesByFilePath.set(aPath, [bPath]);
		dependenciesByFilePath.set(bPath, [cPath]);
		using session = await LintSession.create(configDefinition, host);
		const passes: Set<string>[] = [];

		await session.lintAll();
		await session.lintChangedFiles([cPath], {
			onResults(results) {
				passes.push(lintedFileNames(results));
			},
		});

		expect(passes).toEqual([new Set(["c.txt"]), new Set(["a.txt", "b.txt"])]);
	});

	it("lints dependents of files outside the session", async () => {
		const { configDefinition, dependenciesByFilePath, host, root } =
			await createTestProject();
		const aPath = path.posix.join(root, "a.txt");
		const sharedPath = path.posix.join(root, "shared.json");
		dependenciesByFilePath.set(aPath, [sharedPath]);
		using session = await LintSession.create(configDefinition, host);

		await session.lintAll();

		expect(session.hasDependents(sharedPath)).toBe(true);
		expect(
			lintedFileNames(await session.lintChangedFiles([sharedPath])),
		).toEqual(new Set(["a.txt"]));
	});

	it("replaces dependencies when a file is relinted", async () => {
		const { configDefinition, dependenciesByFilePath, host, root } =
			await createTestProject();
		const aPath = path.posix.join(root, "a.txt");
		const bPath = path.posix.join(root, "b.txt");
		const cPath = path.posix.join(root, "c.txt");
		dependenciesByFilePath.set(aPath, [bPath]);
		using session = await LintSession.create(configDefinition, host);

		await session.lintFiles([aPath]);
		expect(session.hasDependents(bPath)).toBe(true);
		expect(session.hasDependents(cPath)).toBe(false);

		dependenciesByFilePath.set(aPath, [cPath]);
		await session.lintFiles([aPath]);

		expect(session.hasDependents(bPath)).toBe(false);
		expect(lintedFileNames(await session.lintChangedFiles([bPath]))).toEqual(
			new Set(["b.txt"]),
		);
		expect(lintedFileNames(await session.lintChangedFiles([cPath]))).toEqual(
			new Set(["a.txt", "c.txt"]),
		);
	});

	it("lints every file when a cache-invalidating file is relinted", async () => {
		const { configDefinition, host, root } = await createTestProject({
			invalidatingFileNames: new Set(["a.txt"]),
		});
		using session = await LintSession.create(configDefinition, host);
		const aPath = path.posix.join(root, "a.txt");
		const bPath = path.posix.join(root, "b.txt");

		await session.lintAll();

		expect(lintedFileNames(await session.lintChangedFiles([bPath]))).toEqual(
			new Set(["b.txt"]),
		);
		expect(lintedFileNames(await session.lintChangedFiles([aPath]))).toEqual(
			new Set(["a.txt", "b.txt", "c.txt"]),
		);
	});

	it("lints every file when a relinted file starts invalidating the cache", async () => {
		const invalidatingFileNames = new Set<string>();
		const { configDefinition, host, root } = await createTestProject({
			invalidatingFileNames,
		});
		using session = await LintSession.create(configDefinition, host);
		const aPath = path.posix.join(root, "a.txt");
		const bPath = path.posix.join(root, "b.txt");

		await session.lintAll();
		invalidatingFileNames.add("a.txt");

		expect(lintedFileNames(await session.lintChangedFiles([aPath]))).toEqual(
			new Set(["a.txt", "b.txt", "c.txt"]),
		);

		invalidatingFileNames.clear();

		expect(lintedFileNames(await session.lintChangedFiles([aPath]))).toEqual(
			new Set(["a.txt", "b.txt", "c.txt"]),
		);
		expect(lintedFileNames(await session.lintChangedFiles([aPath]))).toEqual(
			new Set(["a.txt"]),
		);
		expect(lintedFileNames(await session.lintChangedFiles([bPath]))).toEqual(
			new Set(["b.txt"]),
		);
	});

	it("reruns every configured file for rules that require all files", async () => {
		const filesSeenInTeardown: string[][] = [];
		const visitedFilePaths: string[] = [];
		const { configDefinition, host, root } = await createTestProject({
			onTeardown: () => {
				filesSeenInTeardown.push([...visitedFilePaths]);
			},
			requiresAllFiles: true,
			visitedFilePaths,
		});
		using session = await LintSession.create(configDefinition, host);

		await session.lintFiles([path.posix.join(root, "a.txt")]);

		expect(
			filesSeenInTeardown.map((filePaths) =>
				filePaths.map((filePath) => path.basename(filePath)),
			),
		).toEqual([["a.txt", "b.txt", "c.txt"]]);
	});

	it("disposes language files and retained factories", async () => {
		const factoryDispose = vi.fn();
		const fileDispose = vi.fn();
		const { configDefinition, host, root } = await createTestProject({
			factoryDispose,
			fileDispose,
		});
		const session = await LintSession.create(configDefinition, host);

		await session.lintFiles([path.posix.join(root, "a.txt")]);
		session[Symbol.dispose]();

		expect(fileDispose).toHaveBeenCalledTimes(1);
		expect(factoryDispose).toHaveBeenCalledTimes(1);
	});

	it("ignores unknown files", async () => {
		const { configDefinition, host, root } = await createTestProject();
		using session = await LintSession.create(configDefinition, host);
		const unknownPath = path.posix.join(root, "unknown.txt");

		expect(session.hasFilePath(path.posix.join(root, "a.txt"))).toBe(true);
		expect(session.hasFilePath(unknownPath)).toBe(false);
		expect(await session.lintFiles([unknownPath])).toEqual(new Map());
	});
});

async function createTestProject({
	factoryDispose,
	fileDispose,
	invalidatingFileNames,
	onTeardown,
	orderedCreatedFilePaths,
	orderFilePaths,
	requiresAllFiles,
	visitedFilePaths,
}: {
	factoryDispose?: () => void;
	fileDispose?: () => void;
	invalidatingFileNames?: Set<string>;
	onTeardown?: () => void;
	orderedCreatedFilePaths?: string[];
	orderFilePaths?: (filePaths: readonly string[]) => string[];
	requiresAllFiles?: boolean;
	visitedFilePaths?: string[];
} = {}) {
	const root = normalizePath(
		await mkdtemp(path.join(os.tmpdir(), "flint-lint-session-")),
	);
	tempDirectories.push(root);

	await writeFile(path.posix.join(root, "a.txt"), "a1");
	await writeFile(path.posix.join(root, "b.txt"), "b1");
	await writeFile(path.posix.join(root, "c.txt"), "c1");

	const host = createDiskBackedLinterHost(root);
	const dependenciesByFilePath = new Map<string, string[]>();
	const createFileFactory = vi.fn(() => ({
		...(factoryDispose && { [Symbol.dispose]: factoryDispose }),
		createFile(data: FileAboutData) {
			orderedCreatedFilePaths?.push(data.filePath);
			return {
				...(fileDispose && { [Symbol.dispose]: fileDispose }),
				about: data,
				services: {
					sourceText: data.sourceText,
				},
			};
		},
	}));

	const language = createLanguage<TestNodes, TestServices>({
		about: { name: "Test" },
		createFileFactory,
		getFileCacheImpacts(file) {
			return {
				dependencies: dependenciesByFilePath.get(file.about.filePath) ?? [],
				invalidatesCache:
					invalidatingFileNames?.has(path.basename(file.about.filePath)) ??
					false,
			};
		},
		getLanguageReports(file) {
			return [{ text: file.services.sourceText }];
		},
		...(orderFilePaths && { orderFilePaths }),
		runFileVisitors(file, fileVisitors) {
			for (const { services, visitors } of fileVisitors) {
				visitors.Root?.({ filePath: file.about.filePath }, services);
			}
		},
	});

	const ruleCreator = new RuleCreator({
		docs: (ruleId) => `https://example.com/rules/${ruleId}`,
		pluginId: "test",
		presets: [],
	});

	const rule = ruleCreator.createRule(language, {
		about: {
			description: "Test rule.",
			id: "test",
		},
		messages: {
			found: {
				primary: "Found.",
				secondary: [],
				suggestions: [],
			},
		},
		...(requiresAllFiles && { requiresAllFiles }),
		setup(context) {
			return {
				...(onTeardown && {
					teardown: () => {
						onTeardown();
						return undefined;
					},
				}),
				visitors: {
					Root(node, services) {
						visitedFilePaths?.push(node.filePath);
						if (typeof services.sourceText !== "string") {
							throw new Error("Expected source text.");
						}

						context.report({
							message: "found",
							range: { begin: 0, end: 0 },
						});
					},
				},
			};
		},
	});

	const configDefinition: ProcessedConfigDefinition = {
		filePath: path.posix.join(root, "flint.config.js"),
		use: [
			{
				files: ["*.txt"],
				rules: [rule],
			},
		],
	};

	return {
		configDefinition,
		createFileFactory,
		dependenciesByFilePath,
		host,
		root,
	};
}

function lintedFileNames(results: Map<string, unknown>) {
	return new Set(
		Array.from(results.keys(), (filePath) => path.basename(filePath)),
	);
}
