import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type * as LanguageServer from "vscode-languageserver/node.js";
import { FileChangeType } from "vscode-languageserver/node.js";

import type * as Core from "@flint.fyi/core";
import type {
	FileResults,
	LintSessionChangedLintOptions,
} from "@flint.fyi/core";
import { normalizePath } from "@flint.fyi/utils";

import { startServer } from "./server.ts";

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
	const callbacks = new Map<string, (params?: unknown) => unknown>();
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
	const session = { lintChangedFiles, [Symbol.dispose]: vi.fn() };

	function on(name: string) {
		return (callback: (params?: unknown) => unknown) => {
			callbacks.set(name, callback);
		};
	}

	const state = {
		callbacks,
		configFileName: "flint.config.mjs" as string | undefined,
		connection: {
			console: { error: vi.fn(), info: vi.fn() },
			listen() {
				return;
			},
			onCodeAction: on("codeAction"),
			onDidChangeTextDocument: on("didChange"),
			onDidChangeWatchedFiles: on("changeWatchedFiles"),
			onDidCloseTextDocument: on("didClose"),
			onDidOpenTextDocument: on("didOpen"),
			onDidSaveTextDocument: on("didSave"),
			onInitialize: on("initialize"),
			onInitialized: on("initialized"),
			onShutdown: on("shutdown"),
			onWillSaveTextDocument: on("willSave"),
			onWillSaveTextDocumentWaitUntil: on("willSaveWaitUntil"),
			sendDiagnostics:
				vi.fn<
					(params: { diagnostics: unknown[]; uri: string }) => Promise<void>
				>(),
		},
		lintChangedFiles,
		lintPasses,
		lintSessionCreate: vi.fn(() => Promise.resolve(session)),
		session,
		validateConfigDefinition: vi.fn<() => string | undefined>(),
	};

	return state;
});

vi.mock("@flint.fyi/core", async (importOriginal) => {
	return {
		...(await importOriginal<typeof Core>()),
		createVFSLinterHost: vi.fn(() => ({
			readFileSync: vi.fn(() => "const value = 1;\n"),
			vfsDeleteFile: vi.fn(),
			vfsUpsertFile: vi.fn(),
		})),
		findConfigFileName: vi.fn(() => Promise.resolve(mocks.configFileName)),
		isConfig: vi.fn(() => true),
		LintSession: { create: mocks.lintSessionCreate },
		validateConfigDefinition: mocks.validateConfigDefinition,
	};
});

vi.mock("@flint.fyi/core/node", () => ({
	createDiskBackedLinterHost: vi.fn(),
}));

vi.mock("vscode-languageserver/node.js", async (importOriginal) => ({
	...(await importOriginal<typeof LanguageServer>()),
	createConnection: () => mocks.connection,
}));

function callback(name: string) {
	return mocks.callbacks.get(name) ?? vi.fn();
}

function changeWatchedFile(
	filePath: string,
	type: FileChangeType = FileChangeType.Changed,
) {
	callback("changeWatchedFiles")({
		changes: [{ type, uri: pathToFileURL(filePath).href }],
	});
}

function closeDocument(filePath: string) {
	callback("didClose")({
		textDocument: { uri: pathToFileURL(filePath).href },
	});
}

function openDocument(filePath: string, text = "value") {
	callback("didOpen")({
		textDocument: {
			languageId: "typescript",
			text,
			uri: pathToFileURL(filePath).href,
			version: 1,
		},
	});
}

describe(startServer, () => {
	let workspaceRoot: string;

	beforeEach(() => {
		vi.useFakeTimers();
		workspaceRoot = mkdtempSync(path.join(os.tmpdir(), "flint-lsp-"));
		writeFileSync(
			path.join(workspaceRoot, "flint.config.mjs"),
			"export default { definition: { use: [] } };\n",
		);
		mocks.lintPasses.length = 0;
		mocks.configFileName = "flint.config.mjs";
	});

	afterEach(() => {
		rmSync(workspaceRoot, { force: true, recursive: true });
		vi.useRealTimers();
	});

	function createWorkspaceInitializeParams() {
		return {
			workspaceFolders: [
				{ name: "workspace", uri: pathToFileURL(workspaceRoot).href },
			],
		};
	}

	async function startInitializedServer(
		initializeParams: unknown = createWorkspaceInitializeParams(),
	) {
		startServer();
		callback("initialize")(initializeParams);
		callback("initialized")();
		await flushQueuedWork();
	}

	it("reports a missing workspace root", async () => {
		const filePath = "/workspace/src/file.ts";

		startServer();
		openDocument(filePath);
		closeDocument(filePath);
		callback("initialize")({});
		callback("initialized")();
		await vi.dynamicImportSettled();

		expect(mocks.connection.console.error).toHaveBeenCalledWith(
			"No workspace root provided.",
		);
		expect(
			callback("codeAction")({
				context: { diagnostics: [] },
				textDocument: { uri: pathToFileURL(filePath).href },
			}),
		).toEqual([]);
	});

	it("stops when the workspace has no config", async () => {
		mocks.configFileName = undefined;

		await startInitializedServer();

		expect(mocks.lintSessionCreate).not.toHaveBeenCalled();
		expect(mocks.connection.console.error).toHaveBeenCalledWith(
			`No flint.config.* found in ${workspaceRoot}`,
		);
	});

	it("reports config validation errors", async () => {
		mocks.validateConfigDefinition.mockReturnValueOnce("Invalid config.");

		await startInitializedServer();

		expect(mocks.connection.console.error).toHaveBeenCalledWith(
			"Lint error: Invalid config.",
		);
		expect(mocks.lintSessionCreate).not.toHaveBeenCalled();
	});

	it.each(["rootPath", "rootUri"] as const)(
		"starts with the legacy %s parameter",
		async (rootProperty) => {
			await startInitializedServer(
				rootProperty === "rootUri"
					? { rootUri: pathToFileURL(workspaceRoot).href }
					: { rootPath: workspaceRoot },
			);

			expect(mocks.lintSessionCreate).toHaveBeenCalled();

			callback("shutdown")();

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
		openDocument(openedFilePath);
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
			callback("codeAction")({
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

		mocks.lintPasses.push([
			new Map([[changedFilePath, createFileResults("changed")]]),
			new Map([[dependentFilePath, createFileResults("dependent")]]),
		]);

		await startInitializedServer();
		openDocument(changedFilePath, "changed");
		await flushQueuedWork();

		expect(mocks.lintChangedFiles).toHaveBeenCalledTimes(1);
		expect(Array.from(mocks.lintChangedFiles.mock.calls[0]?.[0] ?? [])).toEqual(
			[changedFilePath],
		);
		expect(
			mocks.connection.sendDiagnostics.mock.calls.map(([params]) => params.uri),
		).toEqual([
			pathToFileURL(changedFilePath).href,
			pathToFileURL(dependentFilePath).href,
		]);
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
		mocks.configFileName = nextConfigFileName;
		changeWatchedFile(path.join(workspaceRoot, "flint.config.mjs"));
		await flushQueuedWork();

		expect(mocks.validateConfigDefinition).toHaveBeenCalledWith(
			expect.anything(),
			nextConfigFileName,
		);
	});

	it("clears diagnostics that a rebuild does not republish", async () => {
		const filePath = path.join(workspaceRoot, "src/excluded.ts");

		mocks.lintPasses.push([
			new Map([[filePath, createFileResults("before rebuild")]]),
		]);

		await startInitializedServer();
		openDocument(filePath);
		await flushQueuedWork();
		mocks.connection.sendDiagnostics.mockClear();

		changeWatchedFile(path.join(workspaceRoot, "flint.config.mjs"));
		await flushQueuedWork();

		expect(mocks.connection.sendDiagnostics).toHaveBeenCalledExactlyOnceWith({
			diagnostics: [],
			uri: pathToFileURL(filePath).href,
		});
	});

	it("does not relint an open document when it is saved", async () => {
		const filePath = path.join(workspaceRoot, "src/open.ts");

		await startInitializedServer();
		openDocument(filePath);
		await flushQueuedWork();
		mocks.lintChangedFiles.mockClear();

		changeWatchedFile(filePath);
		await flushQueuedWork();

		expect(mocks.lintChangedFiles).not.toHaveBeenCalled();
	});

	it("relints tsconfig dependents without rebuilding the session", async () => {
		const tsconfigPath = normalizePath(
			path.join(workspaceRoot, "tsconfig.json"),
		);

		await startInitializedServer();
		mocks.lintSessionCreate.mockClear();

		changeWatchedFile(tsconfigPath);
		await flushQueuedWork();

		expect(mocks.lintSessionCreate).not.toHaveBeenCalled();
		expect(Array.from(mocks.lintChangedFiles.mock.lastCall?.[0] ?? [])).toEqual(
			[tsconfigPath],
		);
	});

	it("rebuilds when an external watched file is created", async () => {
		await startInitializedServer();
		mocks.lintSessionCreate.mockClear();

		changeWatchedFile(
			path.join(workspaceRoot, "src/new.ts"),
			FileChangeType.Created,
		);
		await flushQueuedWork();

		expect(mocks.lintSessionCreate).toHaveBeenCalledOnce();
	});

	it("re-lints a closed document from disk instead of clearing diagnostics", async () => {
		const filePath = path.join(workspaceRoot, "src/closed.ts");
		const fileUri = pathToFileURL(filePath).href;

		mocks.lintPasses.push(
			[new Map([[filePath, createFileResults("open buffer diagnostic")]])],
			[new Map([[filePath, createFileResults("disk diagnostic")]])],
		);

		await startInitializedServer();
		openDocument(filePath, "open buffer");
		await flushQueuedWork();
		mocks.connection.sendDiagnostics.mockClear();

		closeDocument(filePath);
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
