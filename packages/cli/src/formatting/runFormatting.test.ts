import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";

import type * as formatly from "formatly";
import { resolveFormatter, type Formatter } from "formatly";
import { beforeEach, describe, expect, it, onTestFinished, vi } from "vitest";

import {
	createVFSLinterHost,
	type LintResultsMaybeWithChanges,
} from "@flint.fyi/core";

import { runFormatting } from "./runFormatting.ts";

vi.mock("formatly", () => ({ resolveFormatter: vi.fn() }));

describe(runFormatting, () => {
	beforeEach(() => {
		vi.mocked(resolveFormatter).mockReset();
	});

	it("skips formatting when no formatter is detected", async () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
		host.vfsUpsertFile("/root/index.ts", "const value=1;");

		expect(
			await runFormatting(host, createLintResults("/root/index.ts"), false),
		).toBeUndefined();
		expect(await host.readFile("/root/index.ts")).toBe("const value=1;");
	});

	it.each([false, true, undefined])(
		"checks files with the detected formatter and writes only when fix is %s",
		async (fix) => {
			const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
			host.vfsUpsertFile("/root/dirty.ts", "const value=1;");
			host.vfsUpsertFile("/root/clean.ts", "const value = 1;\n");
			host.vfsUpsertFile("/root/changed.ts", "const value=1;");
			const formatText = vi.fn<Formatter["formatText"]>().mockResolvedValue({
				formatted: "const value = 1;\n",
			});
			vi.mocked(resolveFormatter).mockResolvedValue({
				formatText,
				name: "biome",
				runner: vi.fn(),
				testers: { configFile: /biome/, script: /biome/ },
			});

			expect(
				await runFormatting(
					host,
					{
						...createLintResults(
							"/root/dirty.ts",
							"/root/clean.ts",
							"/root/missing.ts",
						),
						changed: new Set(["/root/changed.ts", "/root/dirty.ts"]),
					},
					fix,
				),
			).toEqual({
				clean: new Set(["/root/clean.ts"]),
				dirty: new Set(["/root/changed.ts", "/root/dirty.ts"]),
				written: !!fix,
			});
			expect(formatText).toHaveBeenCalledTimes(3);
			expect(formatText).toHaveBeenCalledWith({
				cwd: "/root",
				filePath: "/root/dirty.ts",
				text: "const value=1;",
			});
			expect(await host.readFile("/root/dirty.ts")).toBe(
				fix ? "const value = 1;\n" : "const value=1;",
			);
			expect(await host.readFile("/root/changed.ts")).toBe(
				fix ? "const value = 1;\n" : "const value=1;",
			);
		},
	);

	it("propagates formatter errors without writing the file", async () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
		host.vfsUpsertFile("/root/index.ts", "const invalid =");
		const error = new Error("Cannot format invalid syntax");
		vi.mocked(resolveFormatter).mockResolvedValue({
			formatText: vi.fn().mockResolvedValue({ error }),
			name: "biome",
			runner: vi.fn(),
			testers: { configFile: /biome/, script: /biome/ },
		});

		await expect(
			runFormatting(host, createLintResults("/root/index.ts"), true),
		).rejects.toBe(error);
		expect(await host.readFile("/root/index.ts")).toBe("const invalid =");
	});

	it.each(["/root", undefined])(
		"detects once using repository root %s or the working directory",
		async (repositoryRoot) => {
			const host = createVFSLinterHost({
				caseSensitive: true,
				cwd: "/root/packages/project",
			});
			vi.spyOn(host, "getRepositoryRoot").mockReturnValue(repositoryRoot);

			await runFormatting(host, createLintResults(), false);

			expect(resolveFormatter).toHaveBeenCalledExactlyOnceWith(
				repositoryRoot ?? "/root/packages/project",
			);
		},
	);

	it("uses real formatter configuration and ignore files from the repository root", async () => {
		const root = await mkdtemp(path.join(tmpdir(), "flint-formatly-"));
		onTestFinished(async () => {
			await rm(root, { force: true, recursive: true });
		});
		const require = createRequire(import.meta.url);
		await mkdir(path.join(root, "node_modules"));
		await symlink(
			path.dirname(require.resolve("prettier/package.json")),
			path.join(root, "node_modules/prettier"),
			"junction",
		);
		await writeFile(path.join(root, ".prettierrc.json"), '{"semi":false}');
		await writeFile(path.join(root, ".prettierignore"), "ignored.ts\n");
		await writeFile(path.join(root, ".gitignore"), "generated.ts\n");
		vi.mocked(resolveFormatter).mockImplementation(
			(await vi.importActual<typeof formatly>("formatly")).resolveFormatter,
		);
		const host = createVFSLinterHost({
			caseSensitive: true,
			cwd: path.join(root, "nested"),
		});
		vi.spyOn(host, "getRepositoryRoot").mockReturnValue(root);
		const included = path.join(root, "included.ts");
		const ignored = path.join(root, "ignored.ts");
		const generated = path.join(root, "generated.ts");
		host.vfsUpsertFile(included, "const value=1;");
		host.vfsUpsertFile(ignored, "const invalid =");
		host.vfsUpsertFile(generated, "const invalid =");

		expect(
			await runFormatting(
				host,
				createLintResults(included, ignored, generated),
				true,
			),
		).toEqual({
			clean: new Set([generated, ignored]),
			dirty: new Set([included]),
			written: true,
		});
		expect(await host.readFile(included)).toBe("const value = 1\n");
		expect(await host.readFile(ignored)).toBe("const invalid =");
		expect(await host.readFile(generated)).toBe("const invalid =");
	});
});

function createLintResults(
	...allFilePaths: string[]
): LintResultsMaybeWithChanges {
	return {
		allFilePaths: new Set(allFilePaths),
		allFileResults: new Map(),
		cached: undefined,
		ruleCount: 0,
	};
}
