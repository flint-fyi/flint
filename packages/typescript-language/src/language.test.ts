import type {
	createProjectService,
	CreateProjectServiceSettings,
} from "@typescript-eslint/project-service";
import type ts from "typescript";
import { describe, expect, it, vi } from "vitest";

import { createVFSLinterHost, type LinterHost } from "@flint.fyi/core";
import { nullThrows } from "@flint.fyi/utils";

import {
	throwUnknownLanguageExtension,
	typescriptLanguage,
} from "./language.ts";

const projectServices = vi.hoisted(() => [] as ts.server.ProjectService[]);

vi.mock("@typescript-eslint/project-service", async (importOriginal) => {
	const original = await importOriginal<{
		createProjectService: typeof createProjectService;
	}>();

	return {
		...original,
		createProjectService(settings?: CreateProjectServiceSettings) {
			const result = original.createProjectService(settings);
			projectServices.push(result.service);
			return result;
		},
	};
});

const aPath = "/root/a.ts";
const bPath = "/root/b.ts";

describe("typescriptLanguage", () => {
	it("reports selected and inherited configs and consulted package metadata, not filename guesses", () => {
		const vfs = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
		vfs.vfsUpsertFile(
			"/root/tsconfig.json",
			JSON.stringify({ extends: "./settings/compiler.json", files: ["a.ts"] }),
		);
		vfs.vfsUpsertFile(
			"/root/settings/compiler.json",
			JSON.stringify({
				compilerOptions: { module: "nodenext", noLib: true },
				extends: "/shared/base.json",
			}),
		);
		vfs.vfsUpsertFile(
			"/shared/base.json",
			JSON.stringify({ compilerOptions: { strict: true } }),
		);
		vfs.vfsUpsertFile("/root/tsconfig.unrelated.json", "{}");
		vfs.vfsUpsertFile("/root/package.json", '{"type":"module"}');
		vfs.vfsUpsertFile(aPath, "export const a = 1;");
		const factory = typescriptLanguage.createFileFactory(vfs);
		using disposables = new DisposableStack();
		disposables.defer(() => factory[Symbol.dispose]?.());
		using file = factory.createFile(
			createAboutData(aPath, "export const a = 1;"),
		);
		const impacts = typescriptLanguage.getFileCacheImpacts?.(file, vfs);
		expect(impacts?.structuralDependencies).toEqual(
			expect.arrayContaining([
				"/root/package.json",
				"/root/settings/compiler.json",
				"/root/tsconfig.json",
				"/shared/base.json",
			]),
		);
		expect(impacts?.structuralDependencies).not.toContain(
			"/root/tsconfig.unrelated.json",
		);
		expect(impacts?.structuralDependencies).not.toContain(aPath);
		expect(impacts?.dependencies).not.toContain("tsconfig.json");
	});

	it("keeps project config dependencies scoped to each open file", () => {
		const vfs = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
		for (const project of ["first", "second"]) {
			vfs.vfsUpsertFile(
				`/root/${project}/tsconfig.json`,
				'{"compilerOptions":{"noLib":true},"files":["source.ts"]}',
			);
			vfs.vfsUpsertFile(
				`/root/${project}/source.ts`,
				'import "./missing.js"; export {};',
			);
		}
		const factory = typescriptLanguage.createFileFactory(vfs);
		using disposables = new DisposableStack();
		disposables.defer(() => factory[Symbol.dispose]?.());
		const files = ["first", "second"].map((project) =>
			disposables.use(
				factory.createFile(
					createAboutData(
						`/root/${project}/source.ts`,
						'import "./missing.js"; export {};',
					),
				),
			),
		);
		for (const file of files) {
			const dependencies = typescriptLanguage.getFileCacheImpacts?.(
				file,
				vfs,
			).structuralDependencies;
			const projectDirectory = file.about.filePathAbsolute.replace(
				"/source.ts",
				"",
			);
			expect(dependencies).toContain(`${projectDirectory}/tsconfig.json`);
			const otherDirectory = projectDirectory.endsWith("first")
				? "/root/second"
				: "/root/first";
			expect(dependencies).not.toContain(`${otherDirectory}/tsconfig.json`);
			expect(dependencies).not.toContain(`${otherDirectory}/missing.ts`);
		}
	});

	it("closes remaining open client files when the factory is disposed", () => {
		const { factory, service } = createTestFactory();
		const closeClientFile = vi.spyOn(service, "closeClientFile");
		const openClientFile = vi.spyOn(service, "openClientFile");

		const aFile = factory.createFile(
			createAboutData(aPath, "export const a = 1;"),
		);
		factory.createFile(createAboutData(bPath, "export const b = 1;"));

		aFile[Symbol.dispose]();
		factory[Symbol.dispose]?.();

		expect(openClientFile.mock.calls).toEqual([
			[aPath, "export const a = 1;"],
			[bPath, "export const b = 1;"],
		]);
		expect(closeClientFile.mock.calls).toEqual([[aPath], [bPath]]);
	});

	it("reads updated source text when a changed file is recreated before file watchers fire", () => {
		const { factory, vfs } = createTestFactory();

		const first = factory.createFile(
			createAboutData(aPath, "export const a = 1;"),
		);
		expect(first.services.sourceFile.text).toBe("export const a = 1;");
		first[Symbol.dispose]();

		vfs.vfsUpsertFile(aPath, "export const a = 2;");
		const second = factory.createFile(
			createAboutData(aPath, "export const a = 2;"),
		);

		expect(second.services.sourceFile.text).toBe("export const a = 2;");
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

function createAboutData(filePathAbsolute: string, sourceText: string) {
	return {
		filePath: filePathAbsolute,
		filePathAbsolute,
		sourceText,
	};
}

function createTestFactory() {
	const vfs = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
	vfs.vfsUpsertFile(
		"/root/tsconfig.json",
		JSON.stringify({ files: ["a.ts", "b.ts"] }),
	);
	vfs.vfsUpsertFile(aPath, "export const a = 1;");
	vfs.vfsUpsertFile(bPath, "export const b = 1;");

	const hostWithoutWatchers: LinterHost = {
		...vfs,
		watchDirectorySync: () => ({
			[Symbol.dispose]: vi.fn(),
		}),
		watchFileSync: () => ({
			[Symbol.dispose]: vi.fn(),
		}),
	};
	const factory = typescriptLanguage.createFileFactory(hostWithoutWatchers);

	return {
		factory,
		service: nullThrows(
			projectServices.at(-1),
			"Expected the factory to create a project service",
		),
		vfs,
	};
}
