import { describe, expect, it } from "vitest";

import { createVFSLinterHost, type VFSLinterHost } from "@flint.fyi/core";

import { typescriptLanguage } from "./language.ts";

describe("typescriptLanguage", () => {
	it("reuses one program when files share a project", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });
		upsertJson(host, "/repo/tsconfig.json", {
			compilerOptions: { strict: true },
			files: ["src/first.ts", "src/nested/second.ts"],
		});
		host.vfsUpsertFile("/repo/src/first.ts", "export const first = 1;\n");
		host.vfsUpsertFile(
			"/repo/src/nested/second.ts",
			"export const second = 2;\n",
		);

		const factory = typescriptLanguage.createFileFactory(host);
		using first = factory.createFile(fileAboutData(host, "/repo/src/first.ts"));
		using second = factory.createFile(
			fileAboutData(host, "/repo/src/nested/second.ts"),
		);

		expect(second.services.program).toBe(first.services.program);
	});

	it("uses each file's own project when projects overlap", () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/repo" });
		upsertJson(host, "/repo/tsconfig.json", {
			compilerOptions: { strict: false },
			files: ["packages/outer.ts", "packages/inner/src/inner.ts"],
		});
		upsertJson(host, "/repo/packages/inner/tsconfig.json", {
			compilerOptions: { strict: true },
			files: ["src/inner.ts"],
		});
		host.vfsUpsertFile("/repo/packages/outer.ts", "export const outer = 1;\n");
		host.vfsUpsertFile(
			"/repo/packages/inner/src/inner.ts",
			"export const inner = 2;\n",
		);

		const factory = typescriptLanguage.createFileFactory(host);
		using outer = factory.createFile(
			fileAboutData(host, "/repo/packages/outer.ts"),
		);
		using inner = factory.createFile(
			fileAboutData(host, "/repo/packages/inner/src/inner.ts"),
		);

		expect({
			inner: inner.services.program.getCompilerOptions().strict,
			outer: outer.services.program.getCompilerOptions().strict,
		}).toEqual({ inner: true, outer: false });
	});
});

function fileAboutData(host: VFSLinterHost, filePathAbsolute: string) {
	return {
		filePath: filePathAbsolute,
		filePathAbsolute,
		sourceText: host.readFileSync(filePathAbsolute) ?? "",
	};
}

function upsertJson(host: VFSLinterHost, filePath: string, contents: object) {
	host.vfsUpsertFile(filePath, JSON.stringify(contents));
}
