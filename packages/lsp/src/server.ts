import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { TextDocument } from "vscode-languageserver-textdocument";
import {
	CodeActionKind,
	createConnection,
	TextDocuments,
	TextDocumentSyncKind,
	type InitializeParams,
} from "vscode-languageserver/node.js";

import {
	commonlyIgnoredPaths,
	configFileNameCandidates,
	createVFSLinterHost,
	findConfigFileName,
	isConfig,
	LintSession,
	validateConfigDefinition,
	withFileSystemWatcher,
	type FileResults,
	type VFSLinterHost,
} from "@flint.fyi/core";
import { createDiskBackedLinterHost } from "@flint.fyi/core/node";

import { createCodeActions } from "./codeActions.ts";
import { createLspFileSystemWatcher } from "./createLspFileSystemWatcher.ts";
import { mapFileResultsToDiagnostics } from "./diagnostics.ts";
import { filePathToUri } from "./filePathToUri.ts";
import {
	isStructuralFilePath,
	normalizeFilePath,
} from "./lintSessionChanges.ts";

const LINT_DEBOUNCE_MS = 250;
const CONFIG_RELOAD_QUERY_PARAMETER = "flintLspCacheBust";

export function startServer(): void {
	const connection = createConnection(process.stdin, process.stdout);
	const documents = new TextDocuments(TextDocument);
	const pendingFilePaths = new Set<string>();
	const storedResults = new Map<string, FileResults>();

	let currentTask: Promise<void> = Promise.resolve();
	let debounceTimer: NodeJS.Timeout | undefined;
	let lintSession: LintSession | undefined;
	let rebuildPending = false;
	let vfsHost: undefined | VFSLinterHost;
	let watchedFilesSubscription: Disposable | undefined;
	let workspaceRoot: string | undefined;

	connection.onInitialize((initializeParams: InitializeParams) => {
		workspaceRoot = getWorkspaceRoot(initializeParams);

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
		if (!workspaceRoot) {
			connection.console.error("No workspace root provided.");
			return;
		}

		const fileSystemWatcher = createLspFileSystemWatcher(connection);
		vfsHost = createVFSLinterHost({
			baseHost: withFileSystemWatcher(
				createDiskBackedLinterHost(workspaceRoot),
				fileSystemWatcher,
			),
		});
		watchedFilesSubscription = fileSystemWatcher.watchDirectoryWithEventSync(
			workspaceRoot,
			(filePath, event) => {
				if (event === "changed") {
					requestLint(filePath);
				} else {
					requestRebuild();
				}
			},
			{ ignoredPaths: commonlyIgnoredPaths, recursive: true },
		);

		requestRebuild();
	});

	function requestRebuild() {
		rebuildPending = true;
		scheduleLint();
	}

	function requestLint(filePath: string) {
		if (
			workspaceRoot &&
			isStructuralFilePath(filePath, workspaceRoot, configFileNameCandidates)
		) {
			requestRebuild();
			return;
		}

		pendingFilePaths.add(normalizeFilePath(filePath));
		scheduleLint();
	}

	function scheduleLint() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			currentTask = currentTask.then(lintPending).catch((error: unknown) => {
				connection.console.error(`Lint error: ${formatUnknownError(error)}`);
			});
		}, LINT_DEBOUNCE_MS);
	}

	async function lintPending() {
		const previousUris = rebuildPending
			? new Set(storedResults.keys())
			: undefined;
		if (rebuildPending) {
			rebuildPending = false;
			await rebuildSession();
		}

		const filePaths = new Set(pendingFilePaths);
		pendingFilePaths.clear();
		const publishedUris = new Set<string>();

		if (lintSession && filePaths.size) {
			await lintSession.lintChangedFiles(filePaths, {
				async onResults(results) {
					for (const uri of await publishResults(results)) {
						publishedUris.add(uri);
					}
				},
			});
		}

		if (previousUris) {
			await clearDiagnostics(previousUris.difference(publishedUris));
		}
	}

	async function rebuildSession() {
		if (!vfsHost) {
			return;
		}

		const configFileName = await findConfigFileName(vfsHost);
		if (!configFileName) {
			lintSession?.[Symbol.dispose]();
			lintSession = undefined;
			connection.console.error(`No flint.config.* found in ${workspaceRoot}`);
			return;
		}

		const nextLintSession = await LintSession.create(
			await loadConfigDefinition(configFileName),
			vfsHost,
		);
		lintSession?.[Symbol.dispose]();
		lintSession = nextLintSession;
		connection.console.info(`Flint LSP loaded config: ${configFileName}`);

		for (const document of documents.all()) {
			pendingFilePaths.add(normalizeFilePath(fileURLToPath(document.uri)));
		}
	}

	async function loadConfigDefinition(configFileName: string) {
		if (!workspaceRoot) {
			throw new Error("No workspace root provided.");
		}

		const configUrl = pathToFileURL(path.join(workspaceRoot, configFileName));
		configUrl.searchParams.set(
			CONFIG_RELOAD_QUERY_PARAMETER,
			Date.now().toString(),
		);

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

	async function clearDiagnostics(uris: Set<string>) {
		await Promise.all(
			Array.from(uris, (uri) => {
				storedResults.delete(uri);
				return connection.sendDiagnostics({ diagnostics: [], uri });
			}),
		);
	}

	function getDiagnosticDocument(uri: string) {
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
		requestLint(filePath);
	});

	documents.onDidClose((event) => {
		if (!vfsHost) {
			return;
		}

		const filePath = normalizeFilePath(fileURLToPath(event.document.uri));
		vfsHost.vfsDeleteFile(filePath);
		requestLint(filePath);
	});

	connection.onCodeAction((codeActionParams) => {
		const uri = codeActionParams.textDocument.uri;
		const fileResults = storedResults.get(uri);
		const document = documents.get(uri);

		if (!fileResults || !document || !workspaceRoot) {
			return [];
		}

		return createCodeActions(
			uri,
			codeActionParams.context,
			fileResults.reports,
			document,
			{
				getDocument: getDiagnosticDocument,
				workspaceRoot,
			},
		);
	});

	connection.onShutdown(() => {
		clearTimeout(debounceTimer);
		watchedFilesSubscription?.[Symbol.dispose]();
		lintSession?.[Symbol.dispose]();
	});

	documents.listen(connection);
	connection.listen();
}

function formatUnknownError(error: unknown) {
	return error instanceof Error ? error.message : String(error);
}

function getWorkspaceRoot(initializeParams: InitializeParams) {
	const workspaceFolderUri = initializeParams.workspaceFolders?.[0]?.uri;
	if (workspaceFolderUri) {
		return fileURLToPath(workspaceFolderUri);
	}

	const legacyInitializeParams = initializeParams as unknown as {
		rootPath?: null | string;
		rootUri?: null | string;
	};
	if (legacyInitializeParams.rootUri) {
		return fileURLToPath(legacyInitializeParams.rootUri);
	}

	return legacyInitializeParams.rootPath ?? undefined;
}
