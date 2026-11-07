import { describe, expect, it } from "vitest";
import { TextDocument } from "vscode-languageserver-textdocument";

import type { FileResults } from "@flint.fyi/core";

import { mapFileResultsToDiagnostics } from "./diagnostics.ts";

describe(mapFileResultsToDiagnostics, () => {
	it("preserves language report sources separately from Flint rule reports", () => {
		const document = TextDocument.create(
			"file:///workspace/src/file.ts",
			"typescript",
			0,
			"const value: string = 1;\n",
		);
		const fileResults: FileResults = {
			dependencies: new Set(),
			languageReports: [
				{
					code: "TS2322",
					range: { begin: 22, end: 23 },
					source: "flint/typescript",
					text: "Type 'number' is not assignable to type 'string'.",
				},
			],
			reports: [
				{
					about: {
						id: "ts/example",
					},
					message: {
						primary: "Example Flint report.",
						secondary: [],
						suggestions: [],
					},
					range: {
						begin: { column: 6, line: 0, raw: 6 },
						end: { column: 11, line: 0, raw: 11 },
					},
				},
			],
		};

		expect(
			mapFileResultsToDiagnostics(fileResults, document).map((diagnostic) => ({
				code: diagnostic.code,
				source: diagnostic.source,
			})),
		).toEqual([
			{
				code: "ts/example",
				source: "flint",
			},
			{
				code: "TS2322",
				source: "flint/typescript",
			},
		]);
	});
});
