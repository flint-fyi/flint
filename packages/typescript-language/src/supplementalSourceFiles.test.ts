import { SpanMap, SpanMapKind } from "typescript-native/unstable/ast";
import type { Diagnostic } from "typescript-native/unstable/sync";
import { describe, expect, it, vi } from "vitest";

import { createDiskBackedLinterHost } from "@flint.fyi/core";

import { typescriptLanguage } from "./language.ts";

const spanMap = new SpanMap([
	{
		kind: SpanMapKind.Verbatim,
		originalEnd: 14,
		originalStart: 10,
		virtualEnd: 4,
		virtualStart: 0,
	},
]);

// A single line, so authored positions are (line 0, character offset).
const sourceText = "01234567890123456789";

function getLanguageReports(
	fileName: string,
	diagnostics: (fileName: string) => Diagnostic[],
	supplementalFileName?: string,
) {
	const supplemental = supplementalFileName
		? { fileName: supplementalFileName, spanMap }
		: undefined;
	const canonical = {
		fileName,
		spanMap,
		supplementalSourceFileNames: supplementalFileName
			? [supplementalFileName]
			: [],
	};
	const program = {
		getCompilerOptions: () => ({}),
		getConfigFileParsingDiagnostics: () => [],
		getGlobalDiagnostics: () => [],
		getProgramDiagnostics: () => [],
		getSemanticDiagnostics: diagnostics,
		getSourceFile: vi.fn((requested: string) =>
			requested === supplementalFileName ? supplemental : undefined,
		),
		getSyntacticDiagnostics: () => [],
	};
	return typescriptLanguage.getLanguageReports?.(
		{
			about: {
				filePathAbsolute: `${process.cwd()}/${fileName.split("/").at(-1)}`,
				sourceText,
			},
			services: {
				program,
				project: { configFileName: "/project/tsconfig.json" },
				sourceFile: canonical,
			},
		} as never,
		createDiskBackedLinterHost(process.cwd()),
	);
}

describe("supplemental source files", () => {
	it("keeps authored coordinates and de-duplicates diagnostics when TypeScript has mapped them from supplemental source files", () => {
		const reports = getLanguageReports(
			"/project/Component.astro",
			(fileName) => [
				{
					category: 1,
					code: 1234,
					end: 14,
					endPosition: { character: 14, line: 0 },
					fileName,
					pos: 10,
					relatedInformation: [
						{
							category: 1,
							code: 1235,
							end: 13,
							endPosition: { character: 13, line: 0 },
							fileName,
							pos: 11,
							sourceLines: [{ line: 0, text: sourceText }],
							startPosition: { character: 11, line: 0 },
							text: "Related mapped error",
						},
					],
					sourceLines: [{ line: 0, text: sourceText }],
					startPosition: { character: 10, line: 0 },
					text: "Mapped error",
				},
			],
			"/project/Component.astro.0.ts",
		);

		expect(reports).toHaveLength(1);
		expect(reports?.[0]).toMatchObject({
			code: "TS1234",
			range: { begin: 10, end: 14 },
			source: "typescript",
		});
		expect(reports?.[0]?.text).toContain("Component.astro");
		expect(reports?.[0]?.text).toContain("Related mapped error");
		expect(reports?.[0]?.text).not.toContain(".astro.0.ts");
	});

	it("drops a diagnostic when TypeScript left it in the virtual file's coordinates", () => {
		const reports = getLanguageReports(
			"/project/Component.svelte",
			(fileName) => [
				{
					category: 1,
					code: 1234,
					end: 4,
					endPosition: { character: 4, line: 0 },
					fileName,
					pos: 0,
					sourceLines: [{ line: 0, text: "generated code\n" }],
					startPosition: { character: 0, line: 0 },
					text: "Synthesized error",
				},
				{
					category: 1,
					code: 1235,
					end: 60,
					endPosition: { character: 20, line: 2 },
					fileName,
					pos: 45,
					sourceLines: [{ line: 2, text: "more generated code\n" }],
					startPosition: { character: 5, line: 2 },
					text: "Synthesized error past the authored text",
				},
			],
		);

		expect(reports).toEqual([]);
	});
});
