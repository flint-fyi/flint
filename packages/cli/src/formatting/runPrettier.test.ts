import { describe, expect, it, vi } from "vitest";

import {
	createVFSLinterHost,
	type LintResultsMaybeWithChanges,
} from "@flint.fyi/core";

import { runPrettier } from "./runPrettier.ts";

describe(runPrettier, () => {
	it("skips files matched by the host's .prettierignore", async () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
		host.vfsUpsertFile("/root/.prettierignore", "ignored.ts\n");
		host.vfsUpsertFile("/root/ignored.ts", "const invalid =");

		const result = await runPrettier(
			host,
			createLintResults("/root/ignored.ts"),
			false,
		);

		expect(result.clean).toEqual(new Set());
		expect(result.dirty).toEqual(new Set());
	});

	it("formats files not matched by the host's .prettierignore", async () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
		host.vfsUpsertFile("/root/.prettierignore", "ignored.ts\n");
		host.vfsUpsertFile("/root/included.ts", "const value=1;");

		const result = await runPrettier(
			host,
			createLintResults("/root/included.ts"),
			false,
		);

		expect(result.clean).toEqual(new Set());
		expect(result.dirty).toEqual(new Set(["/root/included.ts"]));
	});

	it("formats files when .prettierignore does not exist", async () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
		host.vfsUpsertFile("/root/included.ts", "const value=1;");

		const result = await runPrettier(
			host,
			createLintResults("/root/included.ts"),
			false,
		);

		expect(result.clean).toEqual(new Set());
		expect(result.dirty).toEqual(new Set(["/root/included.ts"]));
	});

	it("reads .prettierignore once for all files", async () => {
		const host = createVFSLinterHost({ caseSensitive: true, cwd: "/root" });
		host.vfsUpsertFile("/root/.prettierignore", "*.ts\n");
		host.vfsUpsertFile("/root/first.ts", "const invalid =");
		host.vfsUpsertFile("/root/second.ts", "const invalid =");
		const readFile = vi.spyOn(host, "readFile");

		await runPrettier(
			host,
			createLintResults("/root/first.ts", "/root/second.ts"),
			false,
		);

		expect(
			readFile.mock.calls.filter(
				([filePath]) => filePath === "/root/.prettierignore",
			),
		).toHaveLength(1);
	});

	it("uses the repository root instead of a nested working directory", async () => {
		const host = createVFSLinterHost({
			caseSensitive: true,
			cwd: "/root/packages/project",
		});
		vi.spyOn(host, "getRepositoryRoot").mockReturnValue("/root");
		host.vfsUpsertFile(
			"/root/.prettierignore",
			"/packages/project/ignored.ts\n",
		);
		host.vfsUpsertFile(
			"/root/packages/project/.prettierignore",
			"included.ts\n",
		);
		host.vfsUpsertFile("/root/packages/project/ignored.ts", "const invalid =");
		host.vfsUpsertFile("/root/packages/project/included.ts", "const value=1;");

		const result = await runPrettier(
			host,
			createLintResults(
				"/root/packages/project/ignored.ts",
				"/root/packages/project/included.ts",
			),
			false,
		);

		expect(result.clean).toEqual(new Set());
		expect(result.dirty).toEqual(
			new Set(["/root/packages/project/included.ts"]),
		);
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
