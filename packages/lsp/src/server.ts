import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { TextDocument } from "vscode-languageserver-textdocument";
import {
	CodeActionKind,
	createConnection,
	DidChangeWatchedFilesNotification,
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
import { normalizePath } from "@flint.fyi/utils";

import { createCodeActions } from "./codeActions.ts";
import { createLspFileSystemWatcher } from "./createLspFileSystemWatcher.ts";
import { mapFileResultsToDiagnostics } from "./diagnostics.ts";
import { filePathToUri } from "./filePathToUri.ts";
import { uriToFilePath } from "./uriToFilePath.ts";

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
	let watchedFilesRegistrationSupported = false;
	let watchedFilesSubscription: Disposable | undefined;
	let workspace: undefined | { root: string; vfsHost: VFSLinterHost };
	let workspaceRoot: string | undefined;

	connection.onInitialize((initializeParams: InitializeParams) => {
		workspaceRoot = getWorkspaceRoot(initializeParams);
		watchedFilesRegistrationSupported =
			initializeParams.capabilities.workspace?.didChangeWatchedFiles
				?.dynamicRegistration === true;

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
				if (event !== "changed" || isConfigFile(filePath, root)) {
					requestRebuild();
				} else if (!getOpenFilePaths().includes(filePath)) {
					requestLint(filePath);
				}
			},
			{ ignoredPaths: commonlyIgnoredPaths, recursive: true },
		);

		if (watchedFilesRegistrationSupported) {
			connection.client
				.register(DidChangeWatchedFilesNotification.type, {
					watchers: [{ globPattern: "**/*" }],
				})
				.catch((error: unknown) => {
					connection.console.error(
						`Could not watch workspace files: ${String(error)}`,
					);
				});
		}

		requestRebuild();
	});

	function getOpenFilePaths() {
		return documents
			.all()
			.map((document) => uriToFilePath(document.uri))
			.filter((filePath) => filePath !== undefined);
	}

	function requestRebuild() {
		rebuildPending = true;
		scheduleLint();
	}

	function requestLint(filePath: string) {
		pendingFilePaths.add(normalizePath(filePath));
		scheduleLint();
	}

	function scheduleLint() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			currentTask = currentTask.then(lintPending).catch((error: unknown) => {
				connection.console.error(
					`Lint error: ${error instanceof Error ? error.message : String(error)}`,
				);
			});
		}, LINT_DEBOUNCE_MS);
	}

	async function lintPending() {
		const previousFilePaths = rebuildPending && new Set(storedResults.keys());
		if (previousFilePaths) {
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

		if (previousFilePaths) {
			await clearDiagnostics(previousFilePaths.difference(results));
		}
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

		for (const filePath of getOpenFilePaths()) {
			pendingFilePaths.add(filePath);
		}
	}

	async function publishResults(filesResults: Map<string, FileResults>) {
		await Promise.all(
			Array.from(filesResults, ([filePath, fileResults]) => {
				storedResults.set(filePath, fileResults);

				return connection.sendDiagnostics({
					diagnostics: mapFileResultsToDiagnostics(
						fileResults,
						getDocument(filePath),
					),
					uri: filePathToUri(filePath),
				});
			}),
		);
	}

	async function clearDiagnostics(filePaths: Set<string>) {
		await Promise.all(
			Array.from(filePaths, (filePath) => {
				storedResults.delete(filePath);
				return connection.sendDiagnostics({
					diagnostics: [],
					uri: filePathToUri(filePath),
				});
			}),
		);
	}

	function getDocument(filePath: string) {
		const sourceText = workspace?.vfsHost.readFileSync(filePath);
		return sourceText == null
			? undefined
			: TextDocument.create(
					filePathToUri(filePath),
					"plaintext",
					0,
					sourceText,
				);
	}

	documents.onDidOpen(({ document }) => {
		const filePath = uriToFilePath(document.uri);
		if (!workspace || !filePath) {
			return;
		}

		if (workspace.vfsHost.fileTypeSync(filePath) === undefined) {
			requestRebuild();
		}
	});

	documents.onDidChangeContent((change) => {
		const filePath = uriToFilePath(change.document.uri);
		if (!workspace || !filePath) {
			return;
		}

		workspace.vfsHost.vfsUpsertFile(filePath, change.document.getText());
		requestLint(filePath);
	});

	documents.onDidClose((event) => {
		const filePath = uriToFilePath(event.document.uri);
		if (!workspace || !filePath) {
			return;
		}

		workspace.vfsHost.vfsDeleteFile(filePath);
		if (workspace.vfsHost.fileTypeSync(filePath) === undefined) {
			requestRebuild();
		} else {
			requestLint(filePath);
		}
	});

	connection.onCodeAction((codeActionParams) => {
		const filePath = uriToFilePath(codeActionParams.textDocument.uri);
		const fileResults = filePath && storedResults.get(filePath);

		if (!fileResults || !workspace) {
			return [];
		}

		return createCodeActions(
			filePath,
			codeActionParams.context,
			fileResults.reports,
			{
				getDocument,
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

function isConfigFile(filePath: string, workspaceRoot: string) {
	return configFileNameCandidates.includes(
		normalizePath(path.relative(workspaceRoot, filePath)),
	);
}

async function loadConfigDefinition(root: string, configFileName: string) {
	const configUrl = pathToFileURL(path.join(root, configFileName));
	configUrl.searchParams.set(
		CONFIG_RELOAD_QUERY_PARAMETER,
		Date.now().toString(),
	);

	const { default: config } = (await import(configUrl.href)) as {
		default: unknown;
	};

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
