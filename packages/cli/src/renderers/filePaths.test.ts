import path from "node:path";
import { stripVTControlCharacters } from "node:util";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
	createVFSLinterHost,
	withRepositoryRoot,
	type FileReport,
} from "@flint.fyi/core";

import { briefPresenterFactory } from "../presenters/briefPresenterFactory.ts";
import { detailedPresenterFactory } from "../presenters/detailed/detailedPresenterFactory.ts";
import { githubPresenterFactory } from "../presenters/githubPresenterFactory.ts";
import { printFile } from "./interactive/printFile.ts";
import { singleRendererFactory } from "./singleRendererFactory.ts";

const reports: FileReport[] = [
	{
		about: { id: "example" },
		message: {
			primary: "Example report.",
			secondary: [],
			suggestions: ["Remove it."],
		},
		range: {
			begin: { column: 0, line: 0, raw: 0 },
			end: { column: 8, line: 0, raw: 8 },
		},
	},
];

describe.each([
	briefPresenterFactory,
	detailedPresenterFactory,
	githubPresenterFactory,
])("$about.name file paths", (factory) => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it.each([
		{ renderer: "single", repository: true, windows: false },
		{ renderer: "interactive", repository: true, windows: false },
		{ renderer: "single", repository: false, windows: false },
		{ renderer: "interactive", repository: false, windows: false },
		{ renderer: "single", repository: true, windows: true },
		{ renderer: "interactive", repository: true, windows: true },
	])(
		"renders workspace-relative paths with $renderer, repository=$repository, windows=$windows",
		async ({ renderer, repository, windows }) => {
			const repositoryRoot = windows
				? String.raw`C:\workspace`
				: path.resolve("workspace");
			const host = createVFSLinterHost({
				caseSensitive: true,
				cwd: windows
					? String.raw`C:\workspace\packages\application`
					: path.join(repositoryRoot, "packages", "application"),
			});
			const filePath = windows
				? String.raw`C:\workspace\packages\application\src\example.ts`
				: path.join(host.getCurrentDirectory(), "src", "example.ts");
			host.vfsUpsertFile(filePath, "debugger;");
			const linterHost = repository
				? withRepositoryRoot(host, repositoryRoot)
				: host;
			const presenter = factory.initialize({
				configFileName: "flint.config.ts",
				ignoreCache: false,
				runMode: "single-run",
			});
			let output = "";

			if (renderer === "interactive") {
				output = await printFile(linterHost, filePath, presenter, reports);
			} else {
				vi.spyOn(process.stdout, "write").mockImplementation((text) => {
					output += text.toString();
					return true;
				});
				await singleRendererFactory.initialize(linterHost, presenter).render({
					duration: 0,
					formattingResults: undefined,
					ignoreCache: false,
					lintResults: {
						allFilePaths: new Set([filePath]),
						allFileResults: new Map([
							[
								filePath,
								{
									dependencies: new Set(),
									languageReports: [],
									missingDependencies: new Set(),
									reports,
								},
							],
						]),
						cached: undefined,
						ruleCount: 1,
					},
				});
			}

			const plainOutput = stripVTControlCharacters(output);
			const displayPath = repository
				? "packages/application/src/example.ts"
				: "src/example.ts";
			const fileHeader =
				factory === githubPresenterFactory
					? `::error file=${displayPath},`
					: factory === detailedPresenterFactory
						? `╭./${displayPath}\n`
						: `${displayPath}\n`;
			expect(plainOutput.trimStart()).toMatch(
				new RegExp(`^${RegExp.escape(fileHeader)}`),
			);
			expect(plainOutput).not.toContain(repositoryRoot.replaceAll("\\", "/"));
			expect(plainOutput).toContain("Example");
		},
	);
});
