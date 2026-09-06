import type { Readable, Writable } from "node:stream";

export interface ContentMapperProject {
	close?: () => Promise<void> | void;
	configIdentity?: string;
	transform: ContentMapperTransform;
	validateOptions?: () => OptionDiagnostic[];
	watchedFiles?: string[];
}
export type ContentMapperTransform = (
	params: TransformParams,
) => Promise<TransformResult> | TransformResult;

export interface DiagnosticDirectives {
	directives: MappedDiagnosticDirective[];
	unusedExpectDirectiveDiagnostics: {
		code: number;
		messageText: string;
	}[];
}

export interface JsonRpcResponse {
	error?: { code: number; message: string };
	id: null | number | string;
	jsonrpc: "2.0";
	result?: unknown;
}

export type MappedDiagnosticDirective = [
	originalStart: number,
	originalLength: number,
	virtualStart: number,
	virtualEnd: number,
	policy: 0 | 1,
	unusedExpectDirectiveIndex?: number,
];

export interface MappedOutput {
	diagnosticDirectives?: DiagnosticDirectives;
	extension: string;
	mappings?: SpanMapping[];
	text: string;
}

export interface MapperDiagnostic {
	code?: number;
	length: number;
	messageText: string;
	start: number;
}

export interface OpenProjectParams {
	compilerOptions: Record<string, unknown>;
	configFileName: string;
	options?: unknown;
	projectHandle: string;
}

export interface OptionDiagnostic {
	code?: number;
	messageText: string;
	path: (number | string)[];
}

export type PositionEncoding = "utf-8" | "utf-16";

export interface RunContentMapperOptions {
	diagnosticSource: string;
	input?: Readable;
	openProject: (
		params: OpenProjectParams,
	) => ContentMapperProject | Promise<ContentMapperProject>;
	output?: Writable;
	transformFailureCode?: number;
}

export type SpanMapping = [
	virtualStart: number,
	virtualLength: number,
	originalStart: number,
	originalLength: number,
	kind: 0 | 1 | 2,
	features?: number,
];

export interface TransformParams {
	content: string;
	fileName: string;
	projectHandle: string;
}

export interface TransformResult extends MappedOutput {
	diagnostics?: MapperDiagnostic[];
	supplemental?: MappedOutput[];
}
