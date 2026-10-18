import { parse } from "@humanwhocodes/momoa";

import type { PlaygroundParsedFile } from "./parsePlaygroundFile.ts";
import { serializeJsonAst } from "./serializeJsonAst.ts";
import type { PlaygroundReport } from "./types.ts";

const locationSuffixPattern = / \(\d+:\d+\)$/;

export function parseJsonFile(code: string): PlaygroundParsedFile {
	try {
		return {
			ast: serializeJsonAst(parse(code, { mode: "json", ranges: true })),
		};
	} catch (error) {
		return { syntaxReport: createSyntaxReport(code, error) };
	}
}

function createSyntaxReport(code: string, error: unknown): PlaygroundReport {
	const message =
		error instanceof Error
			? error.message.replace(locationSuffixPattern, "")
			: String(error);

	// Momoa reports unexpected ends of input at the start of the file.
	const begin = message.startsWith("Unexpected end of input")
		? code.length
		: getErrorOffset(error);
	const linesBefore = code.slice(0, begin).split("\n");

	return {
		begin,
		column: linesBefore.at(-1)?.length ?? 0,
		end: begin,
		id: "SyntaxError",
		line: linesBefore.length - 1,
		message,
		source: "language",
	};
}

function getErrorOffset(error: unknown): number {
	return typeof error === "object" &&
		error !== null &&
		"offset" in error &&
		typeof error.offset === "number"
		? error.offset
		: 0;
}
