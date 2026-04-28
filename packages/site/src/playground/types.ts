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

export interface PlaygroundRequest {
	activePath: string;
	files: PlaygroundFile[];
	requestId: number;
}

export interface PlaygroundResult {
	activePath: string;
	ast: PlaygroundAstNode;
	diagnostics: PlaygroundDiagnostic[];
	requestId: number;
}
