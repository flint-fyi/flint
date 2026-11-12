import { SyntaxKind } from "typescript-native/ast";
import { describe, expect, it } from "vitest";

import { createVFSLinterHost } from "@flint.fyi/core";

import {
	throwUnknownLanguageExtension,
	typescriptLanguage,
} from "./language.ts";

describe("typescriptLanguage file lifecycle", () => {
	it("keeps every file on the final snapshot until LIFO finalization", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });
		host.vfsUpsertFile(
			"/repo/tsconfig.json",
			JSON.stringify({
				compilerOptions: { noLib: true },
				files: ["first.ts", "second.ts"],
			}),
		);
		host.vfsUpsertFile("/repo/first.ts", "export const first = 1;");
		host.vfsUpsertFile("/repo/second.ts", "export const second = 2;");
		const factory = typescriptLanguage.createFileFactory(host);
		const first = factory.createFile({
			filePath: "/repo/first.ts",
			filePathAbsolute: "/repo/first.ts",
			sourceText: "export const first = 1;",
		});
		const firstProgram = first.services.program;
		const second = factory.createFile({
			filePath: "/repo/second.ts",
			filePathAbsolute: "/repo/second.ts",
			sourceText: "export const second = 2;",
		});

		expect(first.services.program).not.toBe(firstProgram);
		expect(first.services.program).toBe(second.services.program);
		expect(first.services.sourceFile.fileName).toBe("/repo/first.ts");
		expect(second.services.sourceFile.fileName).toBe("/repo/second.ts");
		expect(first.services.project).toBeDefined();
		expect(first.services.program).toBeDefined();
		expect(first.services.typeChecker).toBeDefined();

		second[Symbol.dispose]();
		expect(first.services.sourceFile.fileName).toBe("/repo/first.ts");
		first[Symbol.dispose]();
		expect(first.services.program).toBeDefined();
		factory[Symbol.dispose]?.();
		expect(() => first.services.program).toThrow("disposed");
	});

	it("reads updated source text when a prepared file changes before it is recreated", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });
		host.vfsUpsertFile("/repo/index.ts", "export const value = 1;");
		const factory = typescriptLanguage.createFileFactory(host);
		factory.prepareFiles?.(["/repo/index.ts"]);
		const first = factory.createFile({
			filePath: "/repo/index.ts",
			filePathAbsolute: "/repo/index.ts",
			sourceText: "export const value = 1;",
		});
		expect(first.services.sourceFile.text).toBe("export const value = 1;");
		first[Symbol.dispose]();

		host.vfsUpsertFile("/repo/index.ts", "export const value = 2;");
		factory.prepareFiles?.(["/repo/index.ts"]);
		const second = factory.createFile({
			filePath: "/repo/index.ts",
			filePathAbsolute: "/repo/index.ts",
			sourceText: "export const value = 2;",
		});

		expect(second.services.sourceFile.text).toBe("export const value = 2;");
		second[Symbol.dispose]();
		factory[Symbol.dispose]?.();
	});

	it("updates a repeated target file after a zero-active-file gap", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });
		host.vfsUpsertFile(
			"/repo/index.ts",
			'location.href = "javascript:void(0)";',
		);
		const factory = typescriptLanguage.createFileFactory(host);
		const first = factory.createFile({
			filePath: "/repo/index.ts",
			filePathAbsolute: "/repo/index.ts",
			sourceText: 'location.href = "javascript:void(0)";',
		});
		expect(first.services.sourceFile.statements[0]?.kind).toBe(
			SyntaxKind.ExpressionStatement,
		);
		first[Symbol.dispose]();

		host.vfsUpsertFile("/repo/index.ts", "export const value = 2;");
		const second = factory.createFile({
			filePath: "/repo/index.ts",
			filePathAbsolute: "/repo/index.ts",
			sourceText: "export const value = 2;",
		});
		expect(second.services.sourceFile.text).toContain("value = 2");
		expect(second.services.sourceFile.statements[0]?.kind).toBe(
			SyntaxKind.VariableStatement,
		);
		second[Symbol.dispose]();
		factory[Symbol.dispose]?.();
	});

	it("updates created, changed, and deleted auxiliary project files", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });
		host.vfsUpsertFile("/repo/index.ts", 'import "./auxiliary";');
		const factory = typescriptLanguage.createFileFactory(host);
		const createTarget = () =>
			factory.createFile({
				filePath: "/repo/index.ts",
				filePathAbsolute: "/repo/index.ts",
				sourceText: 'import "./auxiliary";',
			});
		const first = createTarget();
		expect(
			first.services.program.getSourceFile("/repo/auxiliary.ts"),
		).toBeUndefined();
		first[Symbol.dispose]();

		host.vfsUpsertFile("/repo/auxiliary.ts", "export const value = 1;");
		const second = createTarget();
		expect(
			second.services.program.getSourceFile("/repo/auxiliary.ts")?.text,
		).toContain("value = 1");
		second[Symbol.dispose]();

		host.vfsUpsertFile("/repo/auxiliary.ts", "export const value = 2;");
		const third = createTarget();
		expect(
			third.services.program.getSourceFile("/repo/auxiliary.ts")?.text,
		).toContain("value = 2");
		third[Symbol.dispose]();

		host.vfsDeleteFile("/repo/auxiliary.ts");
		const fourth = createTarget();
		expect(
			fourth.services.program.getSourceFile("/repo/auxiliary.ts"),
		).toBeUndefined();
		fourth[Symbol.dispose]();
		factory[Symbol.dispose]?.();
	});
});

describe(throwUnknownLanguageExtension, () => {
	it("suggests the matching Flint plugin", () => {
		expect(() => throwUnknownLanguageExtension("file.vue")).toThrow(
			"Cannot process file.vue. Did you install & import @flint.fyi/vue?",
		);
	});

	it("reports an unknown extension", () => {
		expect(() => throwUnknownLanguageExtension("file.unknown")).toThrow(
			"Cannot process file.unknown. Unknown extension.",
		);
	});
});
