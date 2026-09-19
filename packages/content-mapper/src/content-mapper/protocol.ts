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

/**
 * Diagnostic code reported when a content mapper's transform throws.
 *
 * The protocol only carries TypeScript's numeric codes, so mappers whose
 * underlying compiler uses string codes report this and keep the original code
 * in the message text.
 */
export const TRANSFORM_FAILURE_CODE = 1;

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
	kind: SpanMappingKind,
	features?: number,
];

/**
 * Which language-service operations may use a span mapping, as a bit set.
 * Mirrors typescript-go's `spanmap.Feature`. Diagnostics are deliberately not
 * represented: they always map, regardless of features.
 */
export const SpanMappingFeature: Readonly<
	Record<SpanMappingFeatureName, number>
> = {
	// Listed in bit order to match the upstream enum, not alphabetically.
	/* eslint-disable perfectionist/sort-objects */
	Hover: 1 << 0,
	SignatureHelp: 1 << 1,
	Completion: 1 << 2,
	Definition: 1 << 3,
	TypeDefinition: 1 << 4,
	Implementation: 1 << 5,
	References: 1 << 6,
	DocumentHighlights: 1 << 7,
	Rename: 1 << 8,
	CallHierarchy: 1 << 9,
	CodeActions: 1 << 10,
	Formatting: 1 << 11,
	InlayHints: 1 << 12,
	SemanticTokens: 1 << 13,
	FoldingRanges: 1 << 14,
	SelectionRanges: 1 << 15,
	LinkedEditing: 1 << 16,
	AutoInsert: 1 << 17,
	DocumentSymbols: 1 << 18,
	CodeLens: 1 << 19,
	/* eslint-enable perfectionist/sort-objects */
};

export type SpanMappingFeatureName =
	| "AutoInsert"
	| "CallHierarchy"
	| "CodeActions"
	| "CodeLens"
	| "Completion"
	| "Definition"
	| "DocumentHighlights"
	| "DocumentSymbols"
	| "FoldingRanges"
	| "Formatting"
	| "Hover"
	| "Implementation"
	| "InlayHints"
	| "LinkedEditing"
	| "References"
	| "Rename"
	| "SelectionRanges"
	| "SemanticTokens"
	| "SignatureHelp"
	| "TypeDefinition";

/** Every {@link SpanMappingFeature} bit set; the default when a mapping omits `features`. */
export const SPAN_MAPPING_FEATURE_ALL: number =
	(SpanMappingFeature.CodeLens << 1) - 1;

/**
 * How positions inside a span mapping relate the virtual span to the original.
 * Mirrors typescript-go's `spanmap.Kind`.
 */
export const SpanMappingKind = {
	/** Length-preserving: interior positions map 1:1, so text edits can be written back. */
	Verbatim: 0,
	/** Maps the span as a whole; lengths may differ, so interior positions clamp to the endpoints. */
	Atom: 1,
	/** Atom geometry, plus the virtual and original texts name the same entity. */
	Alias: 2,
} as const;

export type SpanMappingKind =
	(typeof SpanMappingKind)[keyof typeof SpanMappingKind];

export interface TransformParams {
	content: string;
	fileName: string;
	projectHandle: string;
}

export interface TransformResult extends MappedOutput {
	diagnostics?: MapperDiagnostic[];
	supplemental?: MappedOutput[];
}
