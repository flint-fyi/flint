export interface PlaygroundAstNode {
	children: PlaygroundAstNode[];
	end: number;
	kind: string;
	pos: number;
	text?: string;
}

export interface PlaygroundDiagnostic {
	category: PlaygroundDiagnosticCategory;
	code: string;
	end: number;
	fileName: string;
	message: string;
	source: "flint" | "typescript";
	start: number;
}

export type PlaygroundDiagnosticCategory =
	| "error"
	| "info"
	| "suggestion"
	| "warning";

export interface PlaygroundFailure {
	error: string;
	requestId: number;
}

export interface PlaygroundFile {
	content: string;
	path: string;
}

/**
 * Per-plugin preset selection — the keys are the plugin ids we recognise
 * (currently only `"ts"`), the values map preset names to enabled flags.
 *
 * The set of valid preset names is discovered at runtime from the worker's
 * {@link PlaygroundSchema}, never hardcoded in the UI.
 */
export type PlaygroundPresetSelection = Record<string, Record<string, boolean>>;

export interface PlaygroundRequest {
	activePath: string;
	files: PlaygroundFile[];
	presetSelection: PlaygroundPresetSelection;
	requestId: number;
}

export interface PlaygroundResult {
	activePath: string;
	ast: PlaygroundAstNode;
	diagnostics: PlaygroundDiagnostic[];
	requestId: number;
	schema: PlaygroundSchema;
}

export interface PlaygroundSchema {
	plugins: PlaygroundPluginSchema[];
}

export interface PlaygroundPluginSchema {
	id: string;
	label: string;
	presets: string[];
}
