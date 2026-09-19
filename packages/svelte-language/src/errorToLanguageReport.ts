import type { CompileError } from "svelte/compiler";

import type { LanguageReport } from "@flint.fyi/core";

/**
 * Describes a thrown Svelte parse or codegen failure as a user-facing report.
 *
 * Svelte's own codes are strings (`js_parse_error`), which is why they land in
 * `LanguageReport["code"]` rather than the numeric TypeScript diagnostic codes.
 */
export function errorToLanguageReport(
	fileName: string,
	error: unknown,
): LanguageReport {
	if (typeof error !== "object" || error == null) {
		return { source: "svelte", text: `${fileName} - Unknown error` };
	}
	const svelteError = isSvelteCompileError(error) ? error : undefined;
	const location = svelteError?.start
		? `:${svelteError.start.line}:${svelteError.start.column}`
		: "";
	return {
		...(typeof svelteError?.code === "string" && { code: svelteError.code }),
		...(svelteError?.start && {
			range: {
				begin: svelteError.start.character,
				end: svelteError.end?.character ?? svelteError.start.character,
			},
		}),
		source: "svelte",
		text: `${fileName}${location} - ${"message" in error && typeof error.message === "string" ? error.message : "Codegen error"}`,
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
