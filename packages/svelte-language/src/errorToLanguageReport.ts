import type { CompileError } from "svelte/compiler";

import type { CharacterReportRange, LanguageReport } from "@flint.fyi/core";

export interface SvelteFailure {
	/** Svelte's own codes are strings (`js_parse_error`), never numeric. */
	code?: string;
	location?: { column: number; line: number };
	message: string;
	range?: CharacterReportRange;
}

/** Pulls the structured pieces out of a thrown Svelte parse or codegen error. */
export function errorToSvelteFailure(error: unknown): SvelteFailure {
	if (typeof error !== "object" || error == null) {
		return { message: "Unknown error" };
	}
	const svelteError = isSvelteCompileError(error) ? error : undefined;
	return {
		...(typeof svelteError?.code === "string" && { code: svelteError.code }),
		...(svelteError?.start && {
			location: {
				column: svelteError.start.column,
				line: svelteError.start.line,
			},
			range: {
				begin: svelteError.start.character,
				end: svelteError.end?.character ?? svelteError.start.character,
			},
		}),
		message:
			"message" in error && typeof error.message === "string"
				? error.message
				: "Codegen error",
	};
}

/**
 * Describes a thrown Svelte parse or codegen failure as a user-facing report.
 *
 * Svelte's string codes land in `LanguageReport["code"]` rather than the
 * numeric TypeScript diagnostic codes.
 */
export function errorToLanguageReport(
	fileName: string,
	error: unknown,
): LanguageReport {
	const failure = errorToSvelteFailure(error);
	const location = failure.location
		? `:${failure.location.line}:${failure.location.column}`
		: "";
	return {
		...(failure.code && { code: failure.code }),
		...(failure.range && { range: failure.range }),
		source: "svelte",
		text: `${fileName}${location} - ${failure.message}`,
	};
}

function isSvelteCompileError(error: object): error is CompileError {
	return (
		"start" in error &&
		typeof error.start === "object" &&
		error.start !== null &&
		"character" in error.start
	);
}
