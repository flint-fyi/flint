import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TextDocument } from "vscode-languageserver-textdocument";
import { FileChangeType } from "vscode-languageserver/node.js";

import type { FileResults } from "@flint.fyi/core";

import { normalizeFilePath } from "./lintSessionChanges.ts";

function createDeferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((res) => {
		resolve = res;
	});

	return { promise, resolve };
}

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
	const lintAll = vi.fn();
	const lintFiles =
		vi.fn<(filePaths: Iterable<string>) => Promise<Map<string, FileResults>>>();
	const state = {
		connection: undefined as unknown as {
			callbacks: {
				changeWatchedFiles?: (event: unknown) => void;
				codeAction?: (params: unknown) => unknown;
				initialize?: (params: unknown) => unknown;
				initialized?: () => Promise<void> | void;
				shutdown?: () => void;
			};
			console: {
				error: ReturnType<typeof vi.fn>;
				info: ReturnType<typeof vi.fn>;
			};
			listen: ReturnType<typeof vi.fn>;
			onCodeAction: ReturnType<typeof vi.fn>;
			onDidChangeWatchedFiles: ReturnType<typeof vi.fn>;
			onInitialize: ReturnType<typeof vi.fn>;
			onInitialized: ReturnType<typeof vi.fn>;
			onShutdown: ReturnType<typeof vi.fn>;
			sendDiagnostics: ReturnType<
				typeof vi.fn<
					(params: { diagnostics: unknown[]; uri: string }) => Promise<void>
				>
			>;
		},
		directoryEntries: [{ name: "flint.config.mjs" }],
		documents: undefined as unknown as {
			fireDidChangeContent(document: { getText(): string; uri: string }): void;
			fireDidClose(document: { getText(): string; uri: string }): void;
		},
		lintAll,
		lintFiles,
		lintSessionCreate: vi.fn(),
		session: {
			dispose: vi.fn(),
			getTransitiveDependentsOf: vi.fn(() => new Set()),
			lintAll,
			lintFiles,
		},
		validateConfigDefinition: vi.fn(() => undefined),
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
		createDiskBackedLinterHost: vi.fn(() => ({
			readDirectory: vi.fn(() => Promise.resolve(mocks.directoryEntries)),
		})),
		createVFSLinterHost: vi.fn(() => ({
			readDirectory: vi.fn(() => Promise.resolve(mocks.directoryEntries)),
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

vi.mock("vscode-languageserver/node.js", () => ({
	CodeActionKind: { QuickFix: "quickfix" },
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
	DiagnosticSeverity: { Error: 1, Warning: 2 },
	FileChangeType: { Changed: 2, Created: 1, Deleted: 3 },
	Range: {
		create(
			startLineOrPosition: number | { character: number; line: number },
			startCharacterOrPosition: number | { character: number; line: number },
			endLine?: number,
			endCharacter?: number,
		) {
			if (typeof startLineOrPosition === "object") {
				return {
					end: startCharacterOrPosition,
					start: startLineOrPosition,
				};
			}

			return {
				end: { character: endCharacter, line: endLine },
				start: {
					character: startCharacterOrPosition,
					line: startLineOrPosition,
				},
			};
		},
	},
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

		keys() {
			return [...this.#documents.keys()];
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
	TextDocumentSyncKind: { Full: 1, Incremental: 2 },
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
		mocks.lintAll.mockReset();
		mocks.lintFiles.mockReset();
		mocks.lintFiles.mockResolvedValue(new Map());
		mocks.lintSessionCreate.mockReset();
		mocks.lintSessionCreate.mockImplementation(() =>
			Promise.resolve(mocks.session),
		);
		mocks.session.dispose.mockReset();
		mocks.session.getTransitiveDependentsOf.mockReset();
		mocks.session.getTransitiveDependentsOf.mockReturnValue(new Set());
		mocks.validateConfigDefinition.mockClear();
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
		await mocks.connection.callbacks.initialized?.();
		await vi.dynamicImportSettled();
	}

	it("publishes opened document diagnostics without starting a full workspace lint", async () => {
		const initialFullLint = createDeferred<Map<string, never>>();
		const openedFileResults: FileResults = {
			dependencies: new Set(),
			languageReports: [
				{
					range: { begin: 0, end: 5 },
					source: "flint/typescript",
					text: "opened file diagnostic",
				},
			],
			reports: [],
		};
		const openedFilePath = path.join(workspaceRoot, "src/index.ts");
		const openedFileUri = pathToFileURL(openedFilePath).href;

		mocks.lintAll.mockReturnValue(initialFullLint.promise);
		mocks.lintFiles.mockResolvedValue(
			new Map([[openedFilePath, openedFileResults]]),
		);

		await startInitializedServer();

		expect(mocks.connection.console.error).not.toHaveBeenCalled();
		expect(mocks.lintSessionCreate).toHaveBeenCalled();

		mocks.documents.fireDidChangeContent(
			TextDocument.create(openedFileUri, "typescript", 1, "value"),
		);
		await vi.advanceTimersByTimeAsync(1_000);

		expect(mocks.connection.console.error).not.toHaveBeenCalled();
		expect(mocks.lintFiles).toHaveBeenCalled();

		try {
			expect(mocks.connection.sendDiagnostics).toHaveBeenCalledWith({
				diagnostics: [
					expect.objectContaining({
						message: "opened file diagnostic",
						source: "flint/typescript",
					}),
				],
				uri: openedFileUri,
			});
			expect(mocks.lintAll).not.toHaveBeenCalled();
		} finally {
			initialFullLint.resolve(new Map<string, never>());
			await vi.runAllTimersAsync();
		}
	});

	it("publishes changed diagnostics before dependent diagnostics", async () => {
		const changedFilePath = normalizeFilePath(
			path.join(workspaceRoot, "src/b.ts"),
		);
		const dependentFilePath = normalizeFilePath(
			path.join(workspaceRoot, "src/a.ts"),
		);
		const transitiveDependentFilePath = normalizeFilePath(
			path.join(workspaceRoot, "src/c.ts"),
		);
		const changedFileUri = pathToFileURL(changedFilePath).href;
		const dependentFileUri = pathToFileURL(dependentFilePath).href;
		const transitiveDependentFileUri = pathToFileURL(
			transitiveDependentFilePath,
		).href;

		mocks.session.getTransitiveDependentsOf.mockReturnValue(
			new Set([dependentFilePath, transitiveDependentFilePath]),
		);
		mocks.lintFiles
			.mockResolvedValueOnce(
				new Map([[changedFilePath, createFileResults("changed")]]),
			)
			.mockResolvedValueOnce(
				new Map([
					[dependentFilePath, createFileResults("dependent")],
					[
						transitiveDependentFilePath,
						createFileResults("transitive dependent"),
					],
				]),
			);

		await startInitializedServer();
		mocks.documents.fireDidChangeContent(
			TextDocument.create(changedFileUri, "typescript", 1, "changed"),
		);
		await flushQueuedWork();

		expect(mocks.lintFiles).toHaveBeenCalledTimes(2);
		expect(Array.from(mocks.lintFiles.mock.calls[0]?.[0] ?? [])).toEqual([
			changedFilePath,
		]);
		expect(new Set(mocks.lintFiles.mock.calls[1]?.[0] ?? [])).toEqual(
			new Set([dependentFilePath, transitiveDependentFilePath]),
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

		mocks.lintFiles
			.mockResolvedValueOnce(
				new Map([[filePath, createFileResults("open buffer diagnostic")]]),
			)
			.mockResolvedValueOnce(new Map())
			.mockResolvedValueOnce(
				new Map([[filePath, createFileResults("disk diagnostic")]]),
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
