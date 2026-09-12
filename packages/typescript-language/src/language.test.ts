import type {
	createProjectService,
	CreateProjectServiceSettings,
} from "@typescript-eslint/project-service";
import type ts from "typescript";
import { describe, expect, it, vi } from "vitest";

import { createVFSLinterHost, type LinterHost } from "@flint.fyi/core";
import { nullThrows } from "@flint.fyi/utils";

import { typescriptLanguage } from "./language.ts";

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
			[Symbol.dispose]() {
				return undefined;
			},
		}),
		watchFileSync: () => ({
			[Symbol.dispose]() {
				return undefined;
			},
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
