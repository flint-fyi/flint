import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
	type Mock,
} from "vitest";
import { TextDocument } from "vscode-languageserver-textdocument";
import type * as LanguageServer from "vscode-languageserver/node.js";
import { FileChangeType } from "vscode-languageserver/node.js";

import type {
	FileResults,
	LintSessionChangedLintOptions,
} from "@flint.fyi/core";
import { normalizePath } from "@flint.fyi/utils";

function createFileResults(message: string) {
	return {
		dependencies: new Set<string>(),
		languageReports: [
			{
				range: { begin: 0, end: 5 },
				source: "flint/typescript",
				text: message,
			},
		],
		reports: [],
	};
}

async function flushQueuedWork() {
	await vi.runAllTimersAsync();
	await vi.dynamicImportSettled();
}

const mocks = vi.hoisted(() => {
	const lintPasses: Map<string, FileResults>[][] = [];
	const lintChangedFiles = vi.fn(
		async (
			_filePaths: Iterable<string>,
			options?: LintSessionChangedLintOptions,
		) => {
			const allResults = new Map<string, FileResults>();

			for (const passResults of lintPasses.shift() ?? []) {
				for (const [filePath, fileResults] of passResults) {
					allResults.set(filePath, fileResults);
				}
				// flint-disable-next-line performance/loopAwaits
				await options?.onResults?.(passResults);
			}

			return allResults;
		},
	);
	const state = {
		connection: undefined as unknown as {
			callbacks: {
				changeWatchedFiles?: (event: unknown) => void;
				codeAction?: (params: unknown) => unknown;
				initialize?: (params: unknown) => unknown;
				initialized?: () => void;
				shutdown?: () => void;
			};
			console: {
				error: Mock;
				info: Mock;
			};
			listen: Mock;
			onCodeAction: Mock;
			onDidChangeWatchedFiles: Mock;
			onInitialize: Mock;
			onInitialized: Mock;
			onShutdown: Mock;
			sendDiagnostics: Mock<
				(params: { diagnostics: unknown[]; uri: string }) => Promise<void>
			>;
		},
		directoryEntries: [{ name: "flint.config.mjs" }],
		documents: undefined as unknown as {
			fireDidChangeContent(document: { getText(): string; uri: string }): void;
			fireDidClose(document: { getText(): string; uri: string }): void;
		},
		lintChangedFiles,
		lintPasses,
		lintSessionCreate: vi.fn(),
		session: {
			lintChangedFiles,
			[Symbol.dispose]: vi.fn(),
		},
		validateConfigDefinition: vi.fn<() => string | undefined>(),
	};

	return state;
});

vi.mock("@flint.fyi/core", () => {
	return {
		commonlyIgnoredPaths: ["/.git", "/.jj", "/node_modules"],
		configFileNameCandidates: [
			"flint.config.ts",
			"flint.config.mts",
			"flint.config.cts",
			"flint.config.mjs",
			"flint.config.cjs",
			"flint.config.js",
		],
		createVFSLinterHost: vi.fn(() => ({
			readFileSync: vi.fn(() => "const value = 1;\n"),
			vfsDeleteFile: vi.fn(),
			vfsUpsertFile: vi.fn(),
		})),
		findConfigFileName: vi.fn(() =>
			Promise.resolve(mocks.directoryEntries[0]?.name),
		),
		formatReport: vi.fn((_, text: string) => text),
		isConfig: vi.fn(() => true),
		LintSession: {
			create: mocks.lintSessionCreate.mockImplementation(() =>
				Promise.resolve(mocks.session),
			),
		},
		validateConfigDefinition: mocks.validateConfigDefinition,
		withFileSystemWatcher: vi.fn((host: unknown) => host),
	};
});

vi.mock("@flint.fyi/core/node", () => ({
	createDiskBackedLinterHost: vi.fn(),
}));

vi.mock("vscode-languageserver/node.js", async (importOriginal) => ({
	...(await importOriginal<typeof LanguageServer>()),
	createConnection: vi.fn(() => {
		mocks.connection = {
			callbacks: {},
			console: {
				error: vi.fn(),
				info: vi.fn(),
			},
			listen: vi.fn(),
			onCodeAction: vi.fn((callback) => {
				mocks.connection.callbacks.codeAction = callback;
			}),
			onDidChangeWatchedFiles: vi.fn((callback) => {
				mocks.connection.callbacks.changeWatchedFiles = callback;
			}),
			onInitialize: vi.fn((callback) => {
				mocks.connection.callbacks.initialize = callback;
			}),
			onInitialized: vi.fn((callback) => {
				mocks.connection.callbacks.initialized = callback;
			}),
			onShutdown: vi.fn((callback) => {
				mocks.connection.callbacks.shutdown = callback;
			}),
			sendDiagnostics:
				vi.fn<
					(params: { diagnostics: unknown[]; uri: string }) => Promise<void>
				>(),
		};

		return mocks.connection;
	}),
	TextDocuments: class {
		#changeContent: ((event: { document: unknown }) => void) | undefined;
		#close: ((event: { document: unknown }) => void) | undefined;
		#documents = new Map<string, unknown>();

		constructor() {
			mocks.documents = this;
		}

		all() {
			return [...this.#documents.values()];
		}

		fireDidChangeContent(document: { getText(): string; uri: string }) {
			this.#documents.set(document.uri, document);
			this.#changeContent?.({ document });
		}

		fireDidClose(document: { getText(): string; uri: string }) {
			this.#documents.delete(document.uri);
			this.#close?.({ document });
		}

		get(uri: string) {
			return this.#documents.get(uri);
		}

		listen() {
			this.#documents.clear();
		}

		onDidChangeContent(callback: (event: { document: unknown }) => void) {
			this.#changeContent = callback;
		}

		onDidClose(callback: (event: { document: unknown }) => void) {
			this.#close = callback;
		}
	},
}));

describe("startServer", () => {
	let workspaceRoot: string;

	beforeEach(() => {
		vi.resetModules();
		vi.useFakeTimers();
		workspaceRoot = mkdtempSync(path.join(os.tmpdir(), "flint-lsp-"));
		writeFileSync(
			path.join(workspaceRoot, "flint.config.mjs"),
			"export default { definition: { use: [] } };\n",
		);
		mocks.lintChangedFiles.mockClear();
		mocks.lintPasses.length = 0;
		mocks.lintSessionCreate.mockReset();
		mocks.lintSessionCreate.mockImplementation(() =>
			Promise.resolve(mocks.session),
		);
		mocks.session[Symbol.dispose].mockReset();
		mocks.validateConfigDefinition.mockReset();
		mocks.validateConfigDefinition.mockReturnValue(undefined);
		mocks.directoryEntries = [{ name: "flint.config.mjs" }];
	});

	afterEach(() => {
		rmSync(workspaceRoot, { force: true, recursive: true });
		vi.useRealTimers();
	});

	async function startInitializedServer() {
		const { startServer } = await import("./server.ts");

		startServer();
		mocks.connection.callbacks.initialize?.({
			workspaceFolders: [
				{
					name: "workspace",
					uri: pathToFileURL(workspaceRoot).href,
				},
			],
		});
		mocks.connection.callbacks.initialized?.();
		await flushQueuedWork();
	}

	it("reports a missing workspace root", async () => {
		const { startServer } = await import("./server.ts");

		startServer();
		const document = TextDocument.create(
			"file:///workspace/src/file.ts",
			"typescript",
			1,
			"value",
		);
		mocks.documents.fireDidChangeContent(document);
		mocks.documents.fireDidClose(document);
		mocks.connection.callbacks.initialize?.({});
		mocks.connection.callbacks.initialized?.();
		await vi.dynamicImportSettled();

		expect(mocks.connection.console.error).toHaveBeenCalledWith(
			"No workspace root provided.",
		);
		expect(
			mocks.connection.callbacks.codeAction?.({
				context: { diagnostics: [] },
				textDocument: { uri: "file:///workspace/src/file.ts" },
			}),
		).toEqual([]);
	});

	it("stops when the workspace has no config", async () => {
		mocks.directoryEntries = [];

		await startInitializedServer();
		await flushQueuedWork();

		expect(mocks.lintSessionCreate).not.toHaveBeenCalled();
		expect(mocks.connection.console.error).toHaveBeenCalledWith(
			`No flint.config.* found in ${workspaceRoot}`,
		);
	});

	it("reports config validation errors", async () => {
		mocks.validateConfigDefinition.mockReturnValue("Invalid config.");

		await startInitializedServer();
		await flushQueuedWork();

		expect(mocks.connection.console.error).toHaveBeenCalledWith(
			"Lint error: Invalid config.",
		);
		expect(mocks.lintSessionCreate).not.toHaveBeenCalled();
	});

	it.each(["rootPath", "rootUri"] as const)(
		"starts with the legacy %s parameter",
		async (rootProperty) => {
			const { startServer } = await import("./server.ts");

			startServer();
			mocks.connection.callbacks.initialize?.(
				rootProperty === "rootUri"
					? { rootUri: pathToFileURL(workspaceRoot).href }
					: { rootPath: workspaceRoot },
			);
			mocks.connection.callbacks.initialized?.();
			await flushQueuedWork();

			expect(mocks.lintSessionCreate).toHaveBeenCalled();

			mocks.connection.callbacks.shutdown?.();

			expect(mocks.session[Symbol.dispose]).toHaveBeenCalled();
		},
	);

	it("publishes opened document diagnostics", async () => {
		const openedFilePath = path.join(workspaceRoot, "src/index.ts");
		const openedFileUri = pathToFileURL(openedFilePath).href;

		mocks.lintPasses.push([
			new Map([[openedFilePath, createFileResults("opened file diagnostic")]]),
		]);

		await startInitializedServer();
		mocks.documents.fireDidChangeContent(
			TextDocument.create(openedFileUri, "typescript", 1, "value"),
		);
		await flushQueuedWork();

		expect(mocks.connection.console.error).not.toHaveBeenCalled();
		expect(mocks.connection.sendDiagnostics).toHaveBeenCalledWith({
			diagnostics: [
				expect.objectContaining({
					message: "opened file diagnostic",
					source: "flint/typescript",
				}),
			],
			uri: openedFileUri,
		});
		expect(
			mocks.connection.callbacks.codeAction?.({
				context: { diagnostics: [] },
				textDocument: { uri: openedFileUri },
			}),
		).toEqual([]);
	});

	it("publishes changed diagnostics before dependent diagnostics", async () => {
		const changedFilePath = normalizePath(path.join(workspaceRoot, "src/b.ts"));
		const dependentFilePath = normalizePath(
			path.join(workspaceRoot, "src/a.ts"),
		);
		const transitiveDependentFilePath = normalizePath(
			path.join(workspaceRoot, "src/c.ts"),
		);
		const changedFileUri = pathToFileURL(changedFilePath).href;
		const dependentFileUri = pathToFileURL(dependentFilePath).href;
		const transitiveDependentFileUri = pathToFileURL(
			transitiveDependentFilePath,
		).href;

		mocks.lintPasses.push([
			new Map([[changedFilePath, createFileResults("changed")]]),
			new Map([
				[dependentFilePath, createFileResults("dependent")],
				[
					transitiveDependentFilePath,
					createFileResults("transitive dependent"),
				],
			]),
		]);

		await startInitializedServer();
		mocks.documents.fireDidChangeContent(
			TextDocument.create(changedFileUri, "typescript", 1, "changed"),
		);
		await flushQueuedWork();

		expect(mocks.lintChangedFiles).toHaveBeenCalledTimes(1);
		expect(Array.from(mocks.lintChangedFiles.mock.calls[0]?.[0] ?? [])).toEqual(
			[changedFilePath],
		);
		expect(mocks.connection.sendDiagnostics.mock.calls[0]?.[0]).toEqual(
			expect.objectContaining({ uri: changedFileUri }),
		);
		expect(
			new Set(
				mocks.connection.sendDiagnostics.mock.calls
					.slice(1)
					.map(([params]) => params.uri),
			),
		).toEqual(new Set([dependentFileUri, transitiveDependentFileUri]));
	});

	it("rediscovers the config file name during structural rebuilds", async () => {
		const nextConfigFileName = "flint.config.cjs";
		writeFileSync(
			path.join(workspaceRoot, nextConfigFileName),
			"module.exports = { definition: { use: [] } };\n",
		);

		await startInitializedServer();

		expect(mocks.validateConfigDefinition).toHaveBeenCalledWith(
			expect.anything(),
			"flint.config.mjs",
		);

		mocks.validateConfigDefinition.mockClear();
		mocks.directoryEntries = [{ name: nextConfigFileName }];
		mocks.connection.callbacks.changeWatchedFiles?.({
			changes: [
				{
					type: FileChangeType.Changed,
					uri: pathToFileURL(path.join(workspaceRoot, "flint.config.mjs")).href,
				},
			],
		});
		await flushQueuedWork();

		expect(mocks.validateConfigDefinition).toHaveBeenCalledWith(
			expect.anything(),
			nextConfigFileName,
		);
	});

	it("clears diagnostics that a rebuild does not republish", async () => {
		const filePath = path.join(workspaceRoot, "src/excluded.ts");
		const fileUri = pathToFileURL(filePath).href;

		mocks.lintPasses.push([
			new Map([[filePath, createFileResults("before rebuild")]]),
		]);

		await startInitializedServer();
		mocks.documents.fireDidChangeContent(
			TextDocument.create(fileUri, "typescript", 1, "value"),
		);
		await flushQueuedWork();
		mocks.connection.sendDiagnostics.mockClear();

		mocks.connection.callbacks.changeWatchedFiles?.({
			changes: [
				{
					type: FileChangeType.Changed,
					uri: pathToFileURL(path.join(workspaceRoot, "flint.config.mjs")).href,
				},
			],
		});
		await flushQueuedWork();

		expect(mocks.connection.sendDiagnostics).toHaveBeenCalledExactlyOnceWith({
			diagnostics: [],
			uri: fileUri,
		});
	});

	it("does not relint an open document when it is saved", async () => {
		const filePath = path.join(workspaceRoot, "src/open.ts");
		const fileUri = pathToFileURL(filePath).href;

		await startInitializedServer();
		mocks.documents.fireDidChangeContent(
			TextDocument.create(fileUri, "typescript", 1, "value"),
		);
		await flushQueuedWork();
		mocks.lintChangedFiles.mockClear();

		mocks.connection.callbacks.changeWatchedFiles?.({
			changes: [{ type: FileChangeType.Changed, uri: fileUri }],
		});
		await flushQueuedWork();

		expect(mocks.lintChangedFiles).not.toHaveBeenCalled();
	});

	it("relints tsconfig dependents without rebuilding the session", async () => {
		const tsconfigPath = normalizePath(
			path.join(workspaceRoot, "tsconfig.json"),
		);

		await startInitializedServer();
		mocks.lintSessionCreate.mockClear();

		mocks.connection.callbacks.changeWatchedFiles?.({
			changes: [
				{ type: FileChangeType.Changed, uri: pathToFileURL(tsconfigPath).href },
			],
		});
		await flushQueuedWork();

		expect(mocks.lintSessionCreate).not.toHaveBeenCalled();
		expect(Array.from(mocks.lintChangedFiles.mock.lastCall?.[0] ?? [])).toEqual(
			[tsconfigPath],
		);
	});

	it("rebuilds when an external watched file is created", async () => {
		await startInitializedServer();
		await flushQueuedWork();
		mocks.lintSessionCreate.mockClear();

		mocks.connection.callbacks.changeWatchedFiles?.({
			changes: [
				{
					type: FileChangeType.Created,
					uri: pathToFileURL(path.join(workspaceRoot, "src/new.ts")).href,
				},
			],
		});
		await flushQueuedWork();

		expect(mocks.lintSessionCreate).toHaveBeenCalledExactlyOnceWith(
			expect.anything(),
			expect.anything(),
		);
	});

	it("re-lints a closed document from disk instead of clearing diagnostics", async () => {
		const filePath = path.join(workspaceRoot, "src/closed.ts");
		const fileUri = pathToFileURL(filePath).href;

		mocks.lintPasses.push(
			[new Map([[filePath, createFileResults("open buffer diagnostic")]])],
			[new Map([[filePath, createFileResults("disk diagnostic")]])],
		);

		await startInitializedServer();
		const document = TextDocument.create(
			fileUri,
			"typescript",
			1,
			"open buffer",
		);
		mocks.documents.fireDidChangeContent(document);
		await flushQueuedWork();
		mocks.connection.sendDiagnostics.mockClear();

		mocks.documents.fireDidClose(document);
		await flushQueuedWork();

		expect(mocks.connection.sendDiagnostics).toHaveBeenCalledWith({
			diagnostics: [
				expect.objectContaining({
					message: "disk diagnostic",
				}),
			],
			uri: fileUri,
		});
		expect(mocks.connection.sendDiagnostics).not.toHaveBeenCalledWith({
			diagnostics: [],
			uri: fileUri,
		});
	});
});
