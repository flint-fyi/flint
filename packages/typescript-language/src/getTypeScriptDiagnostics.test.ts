import ts from "typescript";
import {
	API,
	type Diagnostic,
	type Program,
} from "typescript-native/unstable/sync";
import { describe, expect, it } from "vitest";

import { getTypeScriptDiagnostics } from "./getTypeScriptDiagnostics.ts";

const fileName = "/repo/index.ts";
const sourceText = `
export const syntax = ;
let duplicate;
let duplicate;
const typed: string = 1;
/** @deprecated */
function obsolete(): void {}
obsolete();
export const declaration = class {};
`;

function createDiagnostic(
	text: string,
	detail: string,
	detailMessageChain?: readonly Diagnostic[],
): Diagnostic {
	return {
		category: 1,
		code: 1234,
		end: 1,
		fileName,
		messageChain: [
			{
				...(detailMessageChain && { messageChain: [...detailMessageChain] }),
				category: 1,
				code: 1234,
				end: 0,
				pos: 0,
				text: detail,
			},
		],
		pos: 0,
		text,
	};
}

function createProgram(diagnostics: readonly Diagnostic[]): Program {
	return {
		getCompilerOptions: () => ({}),
		getConfigFileParsingDiagnostics: () => diagnostics,
		getGlobalDiagnostics: () => [],
		getProgramDiagnostics: () => [],
		getSemanticDiagnostics: () => [],
		getSyntacticDiagnostics: () => [],
	} as unknown as Program;
}

function flattenNativeMessage(diagnostic: Diagnostic): string[] {
	return [
		diagnostic.text,
		...(diagnostic.messageChain ?? []).flatMap(flattenNativeMessage),
	];
}

function getLegacyDiagnostics(declaration: boolean): unknown[] {
	const options: ts.CompilerOptions = {
		declaration,
		isolatedDeclarations: declaration,
		noLib: true,
		strict: true,
	};
	const host = ts.createCompilerHost(options);
	host.fileExists = (requestedFileName) => requestedFileName === fileName;
	host.getSourceFile = (requestedFileName, languageVersion) =>
		requestedFileName === fileName
			? ts.createSourceFile(fileName, sourceText, languageVersion)
			: undefined;
	host.readFile = (requestedFileName) =>
		requestedFileName === fileName ? sourceText : undefined;

	const program = ts.createProgram([fileName], options, host);

	return ts
		.getPreEmitDiagnostics(program, program.getSourceFile(fileName))
		.map(normalizeLegacyDiagnostic);
}

function getNativeDiagnostics(declaration: boolean): {
	diagnostics: unknown[];
	directCategories: {
		bind: number;
		declaration: number;
		suggestion: number;
	};
} {
	const api = new API({
		cwd: "/repo",
		fs: {
			fileExists: (requestedFileName) => requestedFileName === fileName,
			readFile: (requestedFileName) =>
				requestedFileName === fileName ? sourceText : null,
		},
	});
	const program = api.createProgram([fileName], {
		compilerOptions: {
			declaration,
			isolatedDeclarations: declaration,
			noLib: true,
			strict: true,
		},
	});

	try {
		return {
			diagnostics: getTypeScriptDiagnostics(program, fileName).map(
				normalizeNativeDiagnostic,
			),
			directCategories: {
				bind: program.getBindDiagnostics(fileName).length,
				declaration: program.getDeclarationDiagnostics(fileName).length,
				suggestion: program.getSuggestionDiagnostics(fileName).length,
			},
		};
	} finally {
		program.dispose();
		api.close();
	}
}

function normalizeLegacyDiagnostic(diagnostic: ts.Diagnostic): unknown {
	return {
		category: diagnostic.category,
		code: diagnostic.code,
		end:
			diagnostic.start === undefined
				? 0
				: diagnostic.start + (diagnostic.length ?? 0),
		fileName: diagnostic.file?.fileName,
		message: ts
			.flattenDiagnosticMessageText(diagnostic.messageText, "\n")
			.split("\n"),
		pos: diagnostic.start ?? 0,
	};
}

function normalizeNativeDiagnostic(diagnostic: Diagnostic): unknown {
	return {
		category: diagnostic.category,
		code: diagnostic.code,
		end: diagnostic.end,
		fileName: diagnostic.fileName,
		message: flattenNativeMessage(diagnostic),
		pos: diagnostic.pos,
	};
}

describe("getTypeScriptDiagnostics", () => {
	it("sorts message chains by shape, then parent text before descendants", () => {
		const parentFirst = createDiagnostic("Head", "A parent", [
			createDiagnostic("z descendant", "detail"),
		]);
		const descendantFirst = createDiagnostic("Head", "B parent", [
			createDiagnostic("a descendant", "detail"),
		]);

		expect(
			getTypeScriptDiagnostics(
				createProgram([descendantFirst, parentFirst]),
				fileName,
			),
		).toEqual([parentFirst, descendantFirst]);
	});

	it("preserves diagnostics with the same head and different message-chain details", () => {
		const first = createDiagnostic("Head", "First detail");
		const second = createDiagnostic("Head", "Second detail");

		expect(
			getTypeScriptDiagnostics(createProgram([second, first]), fileName),
		).toEqual([first, second]);
	});

	it("preserves diagnostics with different related information", () => {
		const first = {
			...createDiagnostic("Head", "Detail"),
			relatedInformation: [createDiagnostic("First related", "Detail")],
		};
		const second = {
			...createDiagnostic("Head", "Detail"),
			relatedInformation: [createDiagnostic("Second related", "Detail")],
		};

		expect(
			getTypeScriptDiagnostics(createProgram([second, first]), fileName),
		).toEqual([first, second]);
	});

	it.each([false, true])(
		"matches source-file-scoped TypeScript 6 getPreEmitDiagnostics with declaration=%s",
		(declaration) => {
			const native = getNativeDiagnostics(declaration);

			expect(native.directCategories.bind).toBeGreaterThan(0);
			expect(native.directCategories.suggestion).toBeGreaterThan(0);
			expect(native.directCategories.declaration > 0).toBe(declaration);
			expect(native.diagnostics).toEqual(getLegacyDiagnostics(declaration));
		},
	);

	it("returns diagnostics sorted and deduplicated", () => {
		const diagnostics = getNativeDiagnostics(true).diagnostics as {
			code: number;
			fileName?: string;
			pos: number;
		}[];

		expect(diagnostics).toEqual(
			[...diagnostics].sort(
				(left, right) =>
					(left.fileName ?? "").localeCompare(right.fileName ?? "") ||
					left.pos - right.pos ||
					left.code - right.code,
			),
		);
		expect(
			new Set(diagnostics.map((diagnostic) => JSON.stringify(diagnostic))),
		).toHaveLength(diagnostics.length);
	});
});
