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
import { normalizePath } from "@flint.fyi/utils";

import { createCodeActions } from "./codeActions.ts";
import { createLspFileSystemWatcher } from "./createLspFileSystemWatcher.ts";
import { mapFileResultsToDiagnostics } from "./diagnostics.ts";
import { filePathToUri } from "./filePathToUri.ts";
import { isStructuralFilePath } from "./lintSessionChanges.ts";

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
	let watchedFilesSubscription: Disposable | undefined;
	let workspace: undefined | { root: string; vfsHost: VFSLinterHost };
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

		const root = workspaceRoot;
		const fileSystemWatcher = createLspFileSystemWatcher(connection);
		workspace = {
			root,
			vfsHost: createVFSLinterHost({
				baseHost: withFileSystemWatcher(
					createDiskBackedLinterHost(root),
					fileSystemWatcher,
				),
			}),
		};
		watchedFilesSubscription = fileSystemWatcher.watchDirectorySync(
			root,
			(filePath, event) => {
				if (event !== "changed") {
					requestRebuild();
				} else if (
					isStructuralFilePath(filePath, root) ||
					!isOpenDocument(filePath)
				) {
					requestLint(filePath);
				}
			},
			{ ignoredPaths: commonlyIgnoredPaths, recursive: true },
		);

		requestRebuild();
	});

	function isOpenDocument(filePath: string) {
		return documents
			.all()
			.some(
				(document) => normalizePath(fileURLToPath(document.uri)) === filePath,
			);
	}

	function requestRebuild() {
		rebuildPending = true;
		scheduleLint();
	}

	function requestLint(filePath: string) {
		if (workspace && isStructuralFilePath(filePath, workspace.root)) {
			requestRebuild();
			return;
		}

		pendingFilePaths.add(normalizePath(filePath));
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
		const previousUris = rebuildPending && new Set(storedResults.keys());
		if (previousUris) {
			rebuildPending = false;
			await rebuildSession();
		}

		const filePaths = new Set(pendingFilePaths);
		pendingFilePaths.clear();

		const results =
			lintSession && filePaths.size
				? await lintSession.lintChangedFiles(filePaths, {
						onResults: publishResults,
					})
				: new Map<string, FileResults>();

		if (!previousUris || !workspace) {
			return;
		}

		const { root } = workspace;
		await clearDiagnostics(
			previousUris.difference(
				new Set(
					Array.from(results.keys(), (filePath) =>
						filePathToUri(filePath, root),
					),
				),
			),
		);
	}

	async function rebuildSession() {
		if (!workspace) {
			return;
		}

		const configFileName = await findConfigFileName(workspace.vfsHost);
		const nextLintSession = configFileName
			? await LintSession.create(
					await loadConfigDefinition(workspace.root, configFileName),
					workspace.vfsHost,
				)
			: undefined;

		lintSession?.[Symbol.dispose]();
		lintSession = nextLintSession;

		if (!configFileName) {
			connection.console.error(`No flint.config.* found in ${workspace.root}`);
			return;
		}

		connection.console.info(`Flint LSP loaded config: ${configFileName}`);

		for (const document of documents.all()) {
			pendingFilePaths.add(normalizePath(fileURLToPath(document.uri)));
		}
	}

	async function publishResults(filesResults: Map<string, FileResults>) {
		if (!workspace) {
			return;
		}

		const { root } = workspace;

		await Promise.all(
			Array.from(filesResults, ([filePath, fileResults]) => {
				const uri = filePathToUri(filePath, root);

				storedResults.set(uri, fileResults);

				return connection.sendDiagnostics({
					diagnostics: mapFileResultsToDiagnostics(
						fileResults,
						getDiagnosticDocument(uri),
					),
					uri,
				});
			}),
		);
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

		const sourceText = workspace?.vfsHost.readFileSync(fileURLToPath(uri));
		return sourceText == null
			? undefined
			: TextDocument.create(uri, "plaintext", 0, sourceText);
	}

	documents.onDidChangeContent((change) => {
		if (!workspace) {
			return;
		}

		const filePath = normalizePath(fileURLToPath(change.document.uri));
		workspace.vfsHost.vfsUpsertFile(filePath, change.document.getText());
		requestLint(filePath);
	});

	documents.onDidClose((event) => {
		if (!workspace) {
			return;
		}

		const filePath = normalizePath(fileURLToPath(event.document.uri));
		workspace.vfsHost.vfsDeleteFile(filePath);
		requestLint(filePath);
	});

	connection.onCodeAction((codeActionParams) => {
		const uri = codeActionParams.textDocument.uri;
		const fileResults = storedResults.get(uri);

		if (!fileResults || !workspace) {
			return [];
		}

		return createCodeActions(
			uri,
			codeActionParams.context,
			fileResults.reports,
			{
				getDocument: getDiagnosticDocument,
				workspaceRoot: workspace.root,
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
	const legacyInitializeParams = initializeParams as unknown as {
		rootPath?: null | string;
		rootUri?: null | string;
	};
	const uri =
		initializeParams.workspaceFolders?.[0]?.uri ??
		legacyInitializeParams.rootUri;

	return uri
		? fileURLToPath(uri)
		: (legacyInitializeParams.rootPath ?? undefined);
}

async function loadConfigDefinition(root: string, configFileName: string) {
	const configUrl = pathToFileURL(path.join(root, configFileName));
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
