import { SpanMap, SpanMapKind } from "typescript-native/unstable/ast";
import { describe, expect, it } from "vitest";

import { typescriptLanguage } from "./language.ts";

describe("supplemental source files", () => {
	it("maps and de-duplicates diagnostics from supplemental source files", () => {
		const spanMap = new SpanMap([
			{
				kind: SpanMapKind.Verbatim,
				originalEnd: 14,
				originalStart: 10,
				virtualEnd: 4,
				virtualStart: 0,
			},
		]);
		const supplemental = {
			fileName: "/project/Component.astro.0.ts",
			spanMap,
		};
		const canonical = {
			fileName: "/project/Component.astro",
			spanMap,
			supplementalSourceFileNames: [supplemental.fileName],
		};
		const program = {
			getCompilerOptions: () => ({}),
			getConfigFileParsingDiagnostics: () => [],
			getGlobalDiagnostics: () => [],
			getProgramDiagnostics: () => [],
			getSemanticDiagnostics: (fileName: string) => [
				{
					category: 1,
					code: 1234,
					end: 4,
					fileName,
					pos: 0,
					relatedInformation: [
						{
							category: 1,
							code: 1235,
							end: 3,
							fileName,
							pos: 1,
							startPosition: { character: 1, line: 0 },
							text: "Related mapped error",
						},
					],
					text: "Mapped error",
				},
			],
			getSourceFile: (fileName: string) =>
				fileName === supplemental.fileName ? supplemental : undefined,
			getSyntacticDiagnostics: () => [],
		};

		const reports = typescriptLanguage.getLanguageReports?.({
			about: {
				filePathAbsolute: `${process.cwd()}/Component.astro`,
				sourceText: "01234567890123456789",
			},
			services: { program, sourceFile: canonical },
		} as never);

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
});
