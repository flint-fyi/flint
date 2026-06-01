import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { TextDocument } from "vscode-languageserver-textdocument";
import {
	CodeActionKind,
	createConnection,
	TextDocuments,
	TextDocumentSyncKind,
	type InitializeParams,
	type InitializeResult,
} from "vscode-languageserver/node.js";

import {
	commonlyIgnoredPaths,
	configFileNameCandidates,
	createDiskBackedLinterHost,
	createVFSLinterHost,
	findConfigFileName,
	isConfig,
	LintSession,
	validateConfigDefinition,
	withFileSystemWatcher,
	type FileResults,
	type ProcessedConfigDefinition,
	type VFSLinterHost,
} from "@flint.fyi/core";

import { createCodeActions } from "./codeActions.ts";
import { createLspFileSystemWatcher } from "./createLspFileSystemWatcher.ts";
import { mapFileResultsToDiagnostics } from "./diagnostics.ts";
import { filePathToUri } from "./filePathToUri.ts";
import {
	isStructuralFilePath,
	lintChangedFiles,
	normalizeFilePath,
} from "./lintSessionChanges.ts";

const LINT_DEBOUNCE_MS = 250;

// `import()` honors ESM module identity per resolved URL. A unique query
// param forces a fresh module graph when the user's config file is reloaded.
const CONFIG_CACHE_BUST_PARAM = "flintLspCacheBust";

interface RebuildSessionResult {
	canLint: boolean;
	previousUris: Set<string>;
}

export function startServer(): void {
	const connection = createConnection(process.stdin, process.stdout);
	const documents = new TextDocuments(TextDocument);

	let workspaceRoot: string | undefined;
	let configFileName: string | undefined;
	let vfsHost: undefined | VFSLinterHost;
	let lintSession: LintSession | undefined;

	const storedResults = new Map<string, FileResults>();

	let debounceTimer: NodeJS.Timeout | undefined;
	let lintInFlight = false;
	let pendingFullRebuild = false;
	const pendingPaths = new Set<string>();
	let structuralVersion = 0;
	let watchedFilesSubscription: Disposable | undefined;

	connection.onInitialize((params: InitializeParams): InitializeResult => {
		workspaceRoot = getWorkspaceRoot(params);

		return {
			capabilities: {
				codeActionProvider: {
					codeActionKinds: [CodeActionKind.QuickFix],
				},
				textDocumentSync: TextDocumentSyncKind.Incremental,
			},
		};
	});

	connection.onInitialized(() => {
		initializeServer().catch((error: unknown) => {
			connection.console.error(
				`Initialization error: ${formatUnknownError(error)}`,
			);
		});
	});

	async function initializeServer() {
		if (!workspaceRoot) {
			connection.console.error("No workspace root provided.");
			return;
		}

		// The LSP-backed watcher feeds onDidChangeWatchedFiles into the host's
		// watchDirectorySync API so we don't have to fan watch events to the
		// linter manually elsewhere in this file.
		vfsHost = createVFSLinterHost({
			baseHost: withFileSystemWatcher(
				createDiskBackedLinterHost(workspaceRoot),
				createLspFileSystemWatcher(connection),
			),
		});

		watchedFilesSubscription = vfsHost.watchDirectorySync(
			workspaceRoot,
			handleWatchedFileChange,
			{ ignoredPaths: commonlyIgnoredPaths, recursive: true },
		);

		configFileName = await findConfigFileName(vfsHost);

		if (!configFileName) {
			connection.console.error(`No flint.config.* found in ${workspaceRoot}`);
		} else {
			connection.console.info(
				`Flint LSP initialized with config: ${configFileName}`,
			);
		}

		requestFullRebuild();
	}

	function handleWatchedFileChange(
		filePath: string,
		event?: "changed" | "created" | "deleted",
	): void {
		if (
			event === "created" ||
			event === "deleted" ||
			(workspaceRoot &&
				isStructuralFilePath(filePath, workspaceRoot, configFileNameCandidates))
		) {
			requestFullRebuild();
			return;
		}

		requestIncrementalLint(filePath);
	}

	function queueLintRun(): void {
		runQueuedLint().catch((error: unknown) => {
			connection.console.error(`Lint error: ${formatUnknownError(error)}`);
		});
	}

	function requestFullRebuild(): void {
		structuralVersion += 1;
		pendingFullRebuild = true;
		pendingPaths.clear();
		queueOpenDocumentPaths();
		if (debounceTimer) {
			clearTimeout(debounceTimer);
			debounceTimer = undefined;
		}
		queueLintRun();
	}

	function requestIncrementalLint(filePath: string): void {
		if (
			workspaceRoot &&
			isStructuralFilePath(filePath, workspaceRoot, configFileNameCandidates)
		) {
			requestFullRebuild();
			return;
		}

		pendingPaths.add(normalizeFilePath(filePath));
		scheduleDebouncedLint();
	}

	function scheduleDebouncedLint(): void {
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}
		debounceTimer = setTimeout(() => {
			debounceTimer = undefined;
			queueLintRun();
		}, LINT_DEBOUNCE_MS);
	}

	async function runQueuedLint(): Promise<void> {
		if (lintInFlight) {
			return;
		}

		if (!pendingFullRebuild && !pendingPaths.size) {
			return;
		}

		lintInFlight = true;

		try {
			let canLint = true;
			let previousUris: Set<string> | undefined;
			const expectedStructuralVersion = structuralVersion;

			if (pendingFullRebuild) {
				pendingFullRebuild = false;
				const rebuildResult = await rebuildSession(expectedStructuralVersion);
				if (rebuildResult == null) {
					return;
				}

				({ canLint, previousUris } = rebuildResult);
				if (canLint) {
					queueOpenDocumentPaths();
				} else {
					pendingPaths.clear();
				}
			}

			if (canLint && pendingPaths.size) {
				const filePaths = new Set(pendingPaths);
				pendingPaths.clear();
				const publishedUris = await lintChangedPathsAndPublish(
					filePaths,
					expectedStructuralVersion,
				);

				if (previousUris && publishedUris) {
					await clearUnpublishedDiagnostics(previousUris, publishedUris);
				}
			} else if (previousUris) {
				await clearUnpublishedDiagnostics(previousUris, new Set());
			}
		} catch (error) {
			connection.console.error(`Lint error: ${formatUnknownError(error)}`);
		} finally {
			lintInFlight = false;

			if (pendingFullRebuild) {
				queueLintRun();
			} else if (pendingPaths.size) {
				scheduleDebouncedLint();
			}
		}
	}

	async function rebuildSession(
		expectedStructuralVersion: number,
	): Promise<RebuildSessionResult | undefined> {
		if (!vfsHost || !workspaceRoot) {
			return undefined;
		}

		const previousUris = new Set(storedResults.keys());
		const nextConfigFileName = await findConfigFileName(vfsHost);

		if (expectedStructuralVersion !== structuralVersion) {
			return undefined;
		}

		if (!nextConfigFileName) {
			configFileName = undefined;
			lintSession?.dispose();
			lintSession = undefined;
			storedResults.clear();
			connection.console.error(`No flint.config.* found in ${workspaceRoot}`);
			return { canLint: false, previousUris };
		}

		configFileName = nextConfigFileName;

		const nextConfigDefinition = await loadConfigDefinition(configFileName);
		const nextLintSession = await LintSession.create(
			nextConfigDefinition,
			vfsHost,
		);

		if (expectedStructuralVersion !== structuralVersion) {
			nextLintSession.dispose();
			return undefined;
		}

		lintSession?.dispose();
		lintSession = nextLintSession;
		storedResults.clear();

		return { canLint: true, previousUris };
	}

	async function lintChangedPathsAndPublish(
		filePaths: Set<string>,
		expectedStructuralVersion: number,
	): Promise<Set<string> | undefined> {
		const session = lintSession;
		if (!session) {
			requestFullRebuild();
			return undefined;
		}

		const isStale = () =>
			expectedStructuralVersion !== structuralVersion ||
			session !== lintSession;

		const { changedResults, dependentFilePaths } = await lintChangedFiles(
			session,
			filePaths,
			{ skipLanguageReports: false },
		);
		if (isStale()) {
			return undefined;
		}

		const publishedUris = await publishResults(changedResults);

		const dependentResults = await session.lintFiles(dependentFilePaths, {
			skipLanguageReports: false,
		});
		if (isStale()) {
			return undefined;
		}

		for (const uri of await publishResults(dependentResults)) {
			publishedUris.add(uri);
		}

		return publishedUris;
	}

	async function loadConfigDefinition(
		configFileName: string,
	): Promise<ProcessedConfigDefinition> {
		if (!workspaceRoot) {
			throw new Error("No workspace root provided.");
		}

		const configUrl = pathToFileURL(path.join(workspaceRoot, configFileName));
		configUrl.searchParams.set(CONFIG_CACHE_BUST_PARAM, Date.now().toString());

		const imported = (await import(configUrl.href)) as Record<string, unknown>;
		const config: unknown = imported.default;

		if (!isConfig(config)) {
			throw new Error(`${configFileName} does not export a Flint config.`);
		}

		const validationError = validateConfigDefinition(
			config.definition,
			configFileName,
		);

		if (validationError) {
			throw new Error(validationError);
		}

		return {
			...config.definition,
			filePath: configFileName,
		};
	}

	async function publishResults(filesResults: Map<string, FileResults>) {
		if (!workspaceRoot) {
			throw new Error("No workspace root provided.");
		}
		const root = workspaceRoot;
		const publishedUris = new Set<string>();

		await Promise.all(
			Array.from(filesResults, ([filePath, fileResults]) => {
				const uri = filePathToUri(filePath, root);

				storedResults.set(uri, fileResults);
				publishedUris.add(uri);

				return connection.sendDiagnostics({
					diagnostics: mapFileResultsToDiagnostics(
						fileResults,
						getDiagnosticDocument(uri),
					),
					uri,
				});
			}),
		);

		return publishedUris;
	}

	async function clearUnpublishedDiagnostics(
		previousUris: Set<string>,
		publishedUris: Set<string>,
	) {
		await Promise.all(
			Array.from(previousUris)
				.filter((uri) => !publishedUris.has(uri))
				.map((uri) => connection.sendDiagnostics({ diagnostics: [], uri })),
		);
	}

	function queueOpenDocumentPaths(): void {
		for (const document of documents.all()) {
			pendingPaths.add(normalizeFilePath(fileURLToPath(document.uri)));
		}
	}

	function getDiagnosticDocument(uri: string): TextDocument | undefined {
		const document = documents.get(uri);
		if (document) {
			return document;
		}

		const sourceText = vfsHost?.readFileSync(fileURLToPath(uri));
		return sourceText == null
			? undefined
			: TextDocument.create(uri, "plaintext", 0, sourceText);
	}

	documents.onDidChangeContent((change) => {
		if (!vfsHost) {
			return;
		}

		const filePath = normalizeFilePath(fileURLToPath(change.document.uri));
		vfsHost.vfsUpsertFile(filePath, change.document.getText());
		requestIncrementalLint(filePath);
	});

	documents.onDidClose((event) => {
		if (!vfsHost) {
			return;
		}

		const filePath = normalizeFilePath(fileURLToPath(event.document.uri));
		vfsHost.vfsDeleteFile(filePath);
		requestIncrementalLint(filePath);
	});

	connection.onCodeAction((params) => {
		const uri = params.textDocument.uri;
		const fileResults = storedResults.get(uri);
		const document = documents.get(uri);

		if (!fileResults || !document || !workspaceRoot) {
			return [];
		}

		return createCodeActions(
			uri,
			params.context,
			fileResults.reports,
			document,
			{
				getDocument: getDiagnosticDocument,
				workspaceRoot,
			},
		);
	});

	connection.onShutdown(() => {
		watchedFilesSubscription?.[Symbol.dispose]();
		watchedFilesSubscription = undefined;
		lintSession?.dispose();
	});

	documents.listen(connection);
	connection.listen();
}

function formatUnknownError(error: unknown) {
	return error instanceof Error ? error.message : String(error);
}

function getWorkspaceRoot(params: InitializeParams) {
	const workspaceFolderUri = params.workspaceFolders?.[0]?.uri;
	if (workspaceFolderUri) {
		return fileURLToPath(workspaceFolderUri);
	}

	// rootUri/rootPath are deprecated in LSP, but still needed for clients
	// that don't yet send workspaceFolders. Cast through `unknown` to avoid
	// deprecation diagnostics while still reading the typed shape.
	const legacy = params as unknown as {
		rootPath?: null | string;
		rootUri?: null | string;
	};
	if (legacy.rootUri) {
		return fileURLToPath(legacy.rootUri);
	}

	return legacy.rootPath ?? undefined;
}
