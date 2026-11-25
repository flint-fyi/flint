import type { FileReport, FinalizedFileResults } from "@flint.fyi/core";

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

export type PlaygroundParser = "json" | "typescript";

export interface PlaygroundRange {
	begin: number;
	end: number;
}

export type PlaygroundReport = FileReport;

export interface PlaygroundRequest {
	files: PlaygroundFile[];
	id: number;
}

export type PlaygroundResponse =
	PlaygroundResponseFailure | PlaygroundResponseSuccess;

export interface PlaygroundResponseFailure {
	error: string;
	id: number;
	kind: "failure";
}

export interface PlaygroundResponseSuccess {
	files: Map<string, FinalizedFileResults>;
	id: number;
	kind: "success";
}
