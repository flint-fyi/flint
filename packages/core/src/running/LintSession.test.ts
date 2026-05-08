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
import type { RuleRuntime } from "../types/rules.ts";
import { LintSession } from "./LintSession.ts";

interface TestNodes {
	Root: { filePath: string };
}

interface TestServices {
	sourceText: string;
}

const tempDirs: string[] = [];

describe(LintSession, () => {
	afterEach(async () => {
		await Promise.all(
			tempDirs
				.splice(0)
				.map((dir) => rm(dir, { force: true, recursive: true })),
		);
	});

	it("reuses language factories across repeated subset linting", async () => {
		const { configDefinition, createFileFactory, host, root } =
			await createTestProject();
		const session = await LintSession.create(configDefinition, host);

		try {
			await session.lintFiles([path.posix.join(root, "a.txt")]);
			await session.lintFiles([path.posix.join(root, "b.txt")]);

			expect(createFileFactory).toHaveBeenCalledTimes(1);
		} finally {
			session.dispose();
		}
	});

	it("only replaces stored results for requested files", async () => {
		const { configDefinition, host, root } = await createTestProject();
		const session = await LintSession.create(configDefinition, host);
		const aPath = path.posix.join(root, "a.txt");
		const bPath = path.posix.join(root, "b.txt");

		try {
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
		} finally {
			session.dispose();
		}
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
		const session = await LintSession.create(configDefinition, host);
		const aPath = path.posix.join(root, "a.txt");
		const bPath = path.posix.join(root, "b.txt");
		const cPath = path.posix.join(root, "c.txt");

		try {
			await session.lintFiles([aPath, bPath, cPath]);

			expect(orderFilePaths).toHaveBeenCalledWith([aPath, bPath, cPath], host);
			expect(orderedCreatedFilePaths).toEqual([cPath, bPath, aPath]);
		} finally {
			session.dispose();
		}
	});

	it("finds transitive dependents through multi-hop dependency chains", async () => {
		const { configDefinition, dependenciesByFilePath, host, root } =
			await createTestProject();
		const aPath = path.posix.join(root, "a.txt");
		const bPath = path.posix.join(root, "b.txt");
		const cPath = path.posix.join(root, "c.txt");
		dependenciesByFilePath.set(aPath, [bPath]);
		dependenciesByFilePath.set(cPath, [aPath]);
		const session = await LintSession.create(configDefinition, host);

		try {
			await session.lintAll();

			const dependents = session.getTransitiveDependentsOf([bPath]);

			expect(
				new Set(
					Array.from(dependents).map((filePath) => path.basename(filePath)),
				),
			).toEqual(new Set(["a.txt", "c.txt"]));
		} finally {
			session.dispose();
		}
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
		session.dispose();

		expect(fileDispose).toHaveBeenCalledTimes(1);
		expect(factoryDispose).toHaveBeenCalledTimes(1);
	});
});

async function createTestProject({
	factoryDispose,
	fileDispose,
	orderedCreatedFilePaths,
	orderFilePaths,
}: {
	factoryDispose?: () => void;
	fileDispose?: () => void;
	orderedCreatedFilePaths?: string[];
	orderFilePaths?: (filePaths: readonly string[]) => string[];
} = {}) {
	const root = normalizePath(
		await mkdtemp(path.join(os.tmpdir(), "flint-lint-session-")),
	);
	tempDirs.push(root);

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
				invalidatesCache: false,
			};
		},
		getLanguageReports(file) {
			return [{ text: file.services.sourceText }];
		},
		...(orderFilePaths && { orderFilePaths }),
		runFileVisitors(file, options, runtime) {
			(
				runtime as RuleRuntime<TestNodes, TestServices & { options: object }>
			).visitors?.Root?.(
				{ filePath: file.about.filePath },
				{ options: options ?? {}, ...file.services },
			);
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
		setup(context) {
			return {
				visitors: {
					Root(_node, services) {
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
