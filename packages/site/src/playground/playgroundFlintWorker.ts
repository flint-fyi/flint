/**
 * Worker that runs the real Flint pipeline against the playground's in-memory
 * file workspace. Loads the published plugins, builds a `runConfig` setup
 * around an in-memory VFS host, and posts diagnostics + an AST snapshot back
 * to the main thread for each request.
 *
 * Currently wired plugins: ts, flint, node, browser, performance, jsx, json,
 * md, yaml, package-json. Spelling and vitest aren't loaded yet (their deps
 * trip up Vite's worker bundling).
 *
 * Top-level imports are kept minimal and the heavy plugin set is loaded
 * lazily via `loadFlint()` so module-load failures surface as catchable
 * errors that can be reported through `PlaygroundFailure` instead of dying
 * silently during worker construction.
 */

import * as ts from "typescript";

import type {
	PlaygroundAstNode,
	PlaygroundDiagnostic,
	PlaygroundFailure,
	PlaygroundPluginSchema,
	PlaygroundPresetSelection,
	PlaygroundRequest,
	PlaygroundResult,
	PlaygroundSchema,
} from "./types.ts";

// `@typescript-eslint/project-service` references `setImmediate` and
// `clearImmediate` as bare globals. `npm-package-arg` (transitive of
// `@flint.fyi/package-json`) references `process` similarly. Workers don't
// have any of these, so polyfill before any Flint module loads.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the polyfill
// shapes intentionally don't match Node's full Process / typeof setImmediate.
const globalScope = globalThis as any;
if (typeof globalScope.setImmediate !== "function") {
	globalScope.setImmediate = (cb: (...args: unknown[]) => void) =>
		globalThis.setTimeout(cb as () => void, 0);
}
if (typeof globalScope.clearImmediate !== "function") {
	globalScope.clearImmediate = (id: unknown) => {
		if (typeof id === "number") {
			globalThis.clearTimeout(id);
		}
	};
}
if (typeof globalScope.process !== "object") {
	globalScope.process = {
		argv: [],
		cwd: () => "/playground",
		env: {},
		platform: "linux",
	};
}

// `ts.sys` is undefined in the browser, and Vite's CJS-interop wrap makes the
// `sys` property non-configurable on the imported namespace. The patch lives
// in a Vite plugin transform of `createTypeScriptServerHost.ts` instead — see
// `astro.config.ts`'s `playground-ts-sys-shim` plugin.

type CoreModule = typeof import("@flint.fyi/core");
type TsPluginModule = typeof import("@flint.fyi/ts");
type JsonPluginModule = typeof import("@flint.fyi/json");
type MdPluginModule = typeof import("@flint.fyi/md");
type YamlPluginModule = typeof import("@flint.fyi/yaml");
type PackageJsonPluginModule = typeof import("@flint.fyi/package-json");
type BrowserPluginModule = typeof import("@flint.fyi/browser");
type NodePluginModule = typeof import("@flint.fyi/node");
type PerformancePluginModule = typeof import("@flint.fyi/performance");
type JsxPluginModule = typeof import("@flint.fyi/jsx");
type FlintPluginModule = typeof import("@flint.fyi/plugin-flint");
type FlintNamespace = {
	browserPlugin: BrowserPluginModule["browser"];
	createVFSLinterHost: CoreModule["createVFSLinterHost"];
	flintPlugin: FlintPluginModule["flint"];
	jsonPlugin: JsonPluginModule["json"];
	jsxPlugin: JsxPluginModule["jsx"];
	mdPlugin: MdPluginModule["md"];
	nodePlugin: NodePluginModule["node"];
	packageJsonPlugin: PackageJsonPluginModule["packageJson"];
	performancePlugin: PerformancePluginModule["performance"];
	runConfig: CoreModule["runConfig"];
	tsPlugin: TsPluginModule["ts"];
	yamlPlugin: YamlPluginModule["yaml"];
};

let flintPromise: Promise<FlintNamespace> | undefined;

function loadFlint(): Promise<FlintNamespace> {
	if (!flintPromise) {
		flintPromise = (async () => {
			const [
				core,
				tsPlugin,
				jsonPlugin,
				mdPlugin,
				yamlPlugin,
				packageJsonPlugin,
				browserPlugin,
				nodePlugin,
				performancePlugin,
				jsxPlugin,
				flintPlugin,
			] = await Promise.all([
				import("@flint.fyi/core") as Promise<CoreModule>,
				import("@flint.fyi/ts") as Promise<TsPluginModule>,
				import("@flint.fyi/json") as Promise<JsonPluginModule>,
				import("@flint.fyi/md") as Promise<MdPluginModule>,
				import("@flint.fyi/yaml") as Promise<YamlPluginModule>,
				import("@flint.fyi/package-json") as Promise<PackageJsonPluginModule>,
				import("@flint.fyi/browser") as Promise<BrowserPluginModule>,
				import("@flint.fyi/node") as Promise<NodePluginModule>,
				import("@flint.fyi/performance") as Promise<PerformancePluginModule>,
				import("@flint.fyi/jsx") as Promise<JsxPluginModule>,
				import("@flint.fyi/plugin-flint") as Promise<FlintPluginModule>,
			]);
			return {
				browserPlugin: browserPlugin.browser,
				createVFSLinterHost: core.createVFSLinterHost,
				flintPlugin: flintPlugin.flint,
				jsonPlugin: jsonPlugin.json,
				jsxPlugin: jsxPlugin.jsx,
				mdPlugin: mdPlugin.md,
				nodePlugin: nodePlugin.node,
				packageJsonPlugin: packageJsonPlugin.packageJson,
				performancePlugin: performancePlugin.performance,
				runConfig: core.runConfig,
				tsPlugin: tsPlugin.ts,
				yamlPlugin: yamlPlugin.yaml,
			};
		})();
	}
	return flintPromise;
}

const VFS_CWD = "/playground";

/** Synthetic config "file path" used by runConfig's cache machinery. */
const VIRTUAL_CONFIG_PATH = `${VFS_CWD}/flint.config.ts`;

interface ReportWithFilePath {
	report: import("@flint.fyi/core").FileReport;
	absolutePath: string;
}

interface PluginEntry {
	id: string;
	files: unknown;
	label: string;
	presets: Record<string, unknown>;
}

async function getPlugins(): Promise<PluginEntry[]> {
	const {
		browserPlugin,
		flintPlugin,
		jsonPlugin,
		jsxPlugin,
		mdPlugin,
		nodePlugin,
		packageJsonPlugin,
		performancePlugin,
		tsPlugin,
		yamlPlugin,
	} = await loadFlint();

	// Plugins without their own `files` declaration (browser, node,
	// performance, plugin-flint) stack against the TypeScript file glob —
	// matching how real Flint configs pair them with `ts.files.all`.
	const tsFiles = tsPlugin.files.all;

	return [
		{
			files: tsFiles,
			id: "ts",
			label: tsPlugin.name,
			presets: tsPlugin.presets as Record<string, unknown>,
		},
		{
			files: tsFiles,
			id: "flint",
			label: flintPlugin.name,
			presets: flintPlugin.presets as Record<string, unknown>,
		},
		{
			files: tsFiles,
			id: "node",
			label: nodePlugin.name,
			presets: nodePlugin.presets as Record<string, unknown>,
		},
		{
			files: tsFiles,
			id: "browser",
			label: browserPlugin.name,
			presets: browserPlugin.presets as Record<string, unknown>,
		},
		{
			files: tsFiles,
			id: "performance",
			label: performancePlugin.name,
			presets: performancePlugin.presets as Record<string, unknown>,
		},
		{
			files: jsxPlugin.files.all,
			id: "jsx",
			label: jsxPlugin.name,
			presets: jsxPlugin.presets as Record<string, unknown>,
		},
		{
			files: jsonPlugin.files.all,
			id: "json",
			label: jsonPlugin.name,
			presets: jsonPlugin.presets as Record<string, unknown>,
		},
		{
			files: mdPlugin.files.all,
			id: "md",
			label: mdPlugin.name,
			presets: mdPlugin.presets as Record<string, unknown>,
		},
		{
			files: yamlPlugin.files.all,
			id: "yaml",
			label: yamlPlugin.name,
			presets: yamlPlugin.presets as Record<string, unknown>,
		},
		{
			files: packageJsonPlugin.files.all,
			id: "packageJson",
			label: packageJsonPlugin.name,
			presets: packageJsonPlugin.presets as Record<string, unknown>,
		},
	];
}

async function buildSchema(): Promise<PlaygroundSchema> {
	const plugins = await getPlugins();
	const pluginSchemas: PlaygroundPluginSchema[] = plugins.map((plugin) => ({
		id: plugin.id,
		label: plugin.label,
		presets: Object.keys(plugin.presets).sort(),
	}));
	return { plugins: pluginSchemas };
}

function pickEnabledPresets(
	pluginPresets: Record<string, unknown>,
	selection: Record<string, boolean> | undefined,
): unknown[] {
	if (!selection) {
		return [];
	}
	const out: unknown[] = [];
	for (const [name, enabled] of Object.entries(selection)) {
		if (!enabled) {
			continue;
		}
		const preset = pluginPresets[name];
		if (preset != null) {
			out.push(preset);
		}
	}
	return out;
}

async function lintWorkspace(
	files: PlaygroundRequest["files"],
	selection: PlaygroundPresetSelection,
): Promise<ReportWithFilePath[]> {
	const { createVFSLinterHost, runConfig } = await loadFlint();
	const { registerVFSFiles } = await import("./shims/node-fs-promises.ts");
	const host = createVFSLinterHost({ cwd: VFS_CWD });

	for (const file of files) {
		host.vfsUpsertFile(`${VFS_CWD}${file.path}`, file.content);
	}

	// Surface the VFS to the `node:fs/promises` shim so `fs.glob` in
	// `computeUseDefinitions` can enumerate workspace files.
	registerVFSFiles(() => host.vfsListFiles());

	const plugins = await getPlugins();
	const use: import("@flint.fyi/core").ConfigDefinition["use"] = [];
	for (const plugin of plugins) {
		const enabled = pickEnabledPresets(plugin.presets, selection[plugin.id]);
		if (!enabled.length) {
			continue;
		}
		use.push({
			files: plugin.files as never,
			rules: enabled as never,
		});
	}

	if (!use.length) {
		return [];
	}

	const processed: import("@flint.fyi/core").ProcessedConfigDefinition = {
		filePath: VIRTUAL_CONFIG_PATH,
		use,
	};

	const results = await runConfig(processed, host, {
		ignoreCache: true,
		skipLanguageReports: true,
	});

	const out: ReportWithFilePath[] = [];
	for (const [absolutePath, fileResult] of results.filesResults) {
		for (const report of fileResult.reports) {
			out.push({ absolutePath, report });
		}
	}
	return out;
}

function interpolate(
	template: string,
	data: Record<string, boolean | number | string> | undefined,
): string {
	if (!data) {
		return template;
	}
	return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) =>
		key in data ? String(data[key]) : match,
	);
}

function reportToDiagnostic(entry: ReportWithFilePath): PlaygroundDiagnostic {
	const relativePath = entry.absolutePath.startsWith(VFS_CWD)
		? entry.absolutePath.slice(VFS_CWD.length)
		: entry.absolutePath;

	return {
		category: "warning",
		code: entry.report.about.id,
		end: entry.report.range.end.raw,
		fileName: relativePath,
		message: interpolate(entry.report.message.primary, entry.report.data),
		source: "flint",
		start: entry.report.range.begin.raw,
	};
}

function buildAst(
	files: PlaygroundRequest["files"],
	activePath: string,
): PlaygroundAstNode | undefined {
	const file = files.find((f) => f.path === activePath);
	if (!file) {
		return undefined;
	}

	const sourceFile = ts.createSourceFile(
		activePath,
		file.content,
		ts.ScriptTarget.Latest,
		true,
		scriptKindForPath(activePath),
	);

	return serializeNode(sourceFile, sourceFile);
}

function scriptKindForPath(fileName: string): ts.ScriptKind {
	if (fileName.endsWith(".tsx")) {
		return ts.ScriptKind.TSX;
	}
	if (fileName.endsWith(".jsx")) {
		return ts.ScriptKind.JSX;
	}
	if (fileName.endsWith(".ts")) {
		return ts.ScriptKind.TS;
	}
	return ts.ScriptKind.JS;
}

function serializeNode(
	node: ts.Node,
	sourceFile: ts.SourceFile,
	depth = 0,
): PlaygroundAstNode {
	const out: PlaygroundAstNode = {
		children: [],
		end: node.end,
		kind: ts.SyntaxKind[node.kind] || `SyntaxKind ${node.kind}`,
		pos: node.pos,
	};

	if (depth < 2) {
		const text = node.getText(sourceFile);
		if (text.length <= 80 && !text.includes("\n")) {
			out.text = text;
		}
	}

	if (depth >= 8) {
		return out;
	}

	node.forEachChild((child) => {
		out.children.push(serializeNode(child, sourceFile, depth + 1));
	});

	return out;
}

globalThis.addEventListener(
	"message",
	async ({ data }: MessageEvent<PlaygroundRequest>) => {
		try {
			const [entries, schema] = await Promise.all([
				lintWorkspace(data.files, data.presetSelection),
				buildSchema(),
			]);
			const diagnostics: PlaygroundDiagnostic[] =
				entries.map(reportToDiagnostic);

			const result: PlaygroundResult = {
				activePath: data.activePath,
				ast:
					buildAst(data.files, data.activePath) ??
					({
						children: [],
						end: 0,
						kind: "SourceFile",
						pos: 0,
					} satisfies PlaygroundAstNode),
				diagnostics,
				requestId: data.requestId,
				schema,
			};

			globalThis.postMessage(result);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			const stack =
				error instanceof Error && error.stack
					? error.stack.split("\n").slice(0, 30).join("\n")
					: "";
			const failure: PlaygroundFailure = {
				error: stack ? `${message}\n\n${stack}` : message,
				requestId: data.requestId,
			};
			globalThis.postMessage(failure);
		}
	},
);
