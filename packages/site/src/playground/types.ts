export interface PlaygroundAstNode {
	end: number;
	kind: string;
	properties: Record<string, PlaygroundAstNode | PlaygroundAstNode[]>;
	start: number;
	text?: string;
}

export interface PlaygroundFile {
	code: string;
	name: string;
}

export interface PlaygroundFileResult {
	ast?: PlaygroundAstNode;
	reports: PlaygroundReport[];
}

export type PlaygroundLanguage = "json" | "typescript";

export interface PlaygroundReport {
	begin: number;
	column: number;
	end: number;
	id: string;
	line: number;
	message: string;
	source: PlaygroundReportSource;
	url?: string;
}

export type PlaygroundReportSource = "flint" | "language";

export interface PlaygroundRequest {
	files: PlaygroundFile[];
	id: number;
}

export type PlaygroundResponse =
	| PlaygroundResponseFailure
	| PlaygroundResponseSuccess;

export interface PlaygroundResponseFailure {
	error: string;
	id: number;
	kind: "failure";
}

export interface PlaygroundResponseSuccess {
	files: Record<string, PlaygroundFileResult>;
	id: number;
	kind: "success";
}
