import ts from "typescript";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createVFSLinterHost } from "@flint.fyi/core";

import { typescriptLanguage } from "./language.ts";

const mocks = vi.hoisted(() => {
	const sourceFiles = new Map<string, ts.SourceFile>();
	const program = {
		getSourceFile: vi.fn((filePath: string) => sourceFiles.get(filePath)),
		getTypeChecker: vi.fn(() => ({})),
	};
	const languageService = {
		getProgram: vi.fn(() => program),
	};
	const defaultProject = {
		getLanguageService: vi.fn(() => languageService),
	};
	const service = {
		closeClientFile: vi.fn(),
		getDefaultProjectForFile: vi.fn(() => defaultProject),
		getScriptInfo: vi.fn((fileName: string) => ({ fileName })),
		openClientFile: vi.fn(),
	};

	return {
		createProjectService: vi.fn(() => ({ service })),
		service,
		sourceFiles,
	};
});

vi.mock("@typescript-eslint/project-service", () => ({
	createProjectService: mocks.createProjectService,
}));

describe("typescriptLanguage", () => {
	beforeEach(() => {
		mocks.createProjectService.mockClear();
		mocks.service.closeClientFile.mockClear();
		mocks.service.getDefaultProjectForFile.mockClear();
		mocks.service.getScriptInfo.mockClear();
		mocks.service.openClientFile.mockClear();
		mocks.sourceFiles.clear();
	});

	it("closes remaining open client files when the factory is disposed", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
		const aPath = "/root/a.ts";
		const bPath = "/root/b.ts";
		mocks.sourceFiles.set(
			aPath,
			ts.createSourceFile(aPath, "", ts.ScriptTarget.Latest, true),
		);
		mocks.sourceFiles.set(
			bPath,
			ts.createSourceFile(bPath, "", ts.ScriptTarget.Latest, true),
		);

		const factory = typescriptLanguage.createFileFactory(host);
		const aFile = factory.createFile({
			filePath: aPath,
			filePathAbsolute: aPath,
			sourceText: "",
		});
		factory.createFile({
			filePath: bPath,
			filePathAbsolute: bPath,
			sourceText: "",
		});

		aFile[Symbol.dispose]();
		factory[Symbol.dispose]?.();

		expect(mocks.service.openClientFile.mock.calls).toEqual([[aPath], [bPath]]);
		expect(mocks.service.closeClientFile.mock.calls).toEqual([
			[aPath],
			[bPath],
		]);
	});
});
