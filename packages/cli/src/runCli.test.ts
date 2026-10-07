import { stripVTControlCharacters } from "node:util";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { addFlintAssertionContext } from "@flint.fyi/utils";

import packageData from "../package.json" with { type: "json" };
import { createRendererFactory } from "./renderers/createRendererFactory.ts";
import { runCli } from "./runCli.ts";
import { runCliOnce } from "./runCliOnce.ts";
import { runCliWatch } from "./runCliWatch.ts";

const disposeRenderer = vi.fn();
const ephemeralHost = { name: "ephemeral" };
const getRenderer = vi.fn(() => ({ dispose: disposeRenderer }));
const host = { getCurrentDirectory: () => "/cwd" };

vi.mock("@flint.fyi/core", () => ({
	createEphemeralLinterHost: () => ephemeralHost,
	findConfigFileName: () => "flint.config.ts",
}));

vi.mock("@flint.fyi/core/node", () => ({
	createDiskBackedLinterHost: () => host,
}));

vi.mock("@flint.fyi/utils", () => ({
	addFlintAssertionContext: vi.fn((error: unknown) => error),
}));

vi.mock("./renderers/createRendererFactory.ts", () => ({
	createRendererFactory: vi.fn(() => getRenderer),
}));

vi.mock("./runCliOnce.ts", () => ({
	runCliOnce: vi.fn(() => ({ exitCode: 1 })),
}));

vi.mock("./runCliWatch.ts", () => ({
	runCliWatch: vi.fn(),
}));

describe(runCli, () => {
	const mockError = vi.fn();
	const mockLog = vi.fn();

	beforeEach(() => {
		vi.spyOn(console, "error").mockImplementation(mockError);
		vi.spyOn(console, "log").mockImplementation(mockLog);
	});

	it("should print help when --help is provided", async () => {
		const exitCode = await runCli(["--help"]);
		const output = mockLog.mock.calls[0]?.[0] as string;

		expect(exitCode).toBe(0);
		expect(output).toContain(
			"\u001B]8;;flint.fyi\u0007flint.fyi\u001B]8;;\u0007",
		);
		expect(stripVTControlCharacters(output)).toMatchInlineSnapshot(`
			"Usage: flint [options]

			Welcome to Flint!
			Flint is still very early stage and experimental.

			Options:
			      --cache-ignore                       Whether to ignore any existing cache data on disk. This will cause a full re-lint of all linted files.
			      --cache-location <path>              The path to the cache file or directory to use.
			      --fix                                Enables auto-fixing 'fixes' from rule reports.
			      --fix-suggestions <suggestion>       Enables auto-fixing any number of specific 'suggestions' from rule reports. (repeatable)
			      --interactive                        Whether to run Flint with an interactive 'one file at a time' viewer.
			      --presenter <brief|detailed|github>  Which 'presenter' to output results using: brief (default) or detailed.
			      --skip-formatting                    Whether to skip formatting after linting.
			      --skip-language-reports              Whether to skip generating language reports after linting.
			      --watch                              Whether to keep the linting process running, re-linting files as they change.
			  -h, --help                               Show this help message
			  -v, --version                            Show the version number

			See flint.fyi for more information."
		`);
		expect(createRendererFactory).not.toHaveBeenCalled();
	});

	it("should print the package version when --version is provided", async () => {
		const exitCode = await runCli(["--version"]);

		expect(exitCode).toBe(0);
		expect(mockLog).toHaveBeenCalledWith(packageData.version);
		expect(createRendererFactory).not.toHaveBeenCalled();
	});

	it("should print a suggestion when an unknown flag is provided", async () => {
		const exitCode = await runCli(["--fx"]);

		expect(exitCode).toBe(2);
		expect(mockError.mock.calls).toMatchInlineSnapshot(`
			[
			  [
			    "Unknown flag: --fx (did you mean --fix?)
			Run 'flint --help' for usage.",
			  ],
			]
		`);
		expect(createRendererFactory).not.toHaveBeenCalled();
	});

	it("should print an error when an invalid presenter is provided", async () => {
		const exitCode = await runCli(["--presenter", "unknown"]);

		expect(exitCode).toBe(2);
		expect(mockError.mock.calls).toMatchInlineSnapshot(`
			[
			  [
			    "--presenter: Invalid option: expected one of "brief"|"detailed"|"github"
			Run 'flint --help' for usage.",
			  ],
			]
		`);
		expect(createRendererFactory).not.toHaveBeenCalled();
	});

	it("should print an error when a positional argument is provided", async () => {
		const exitCode = await runCli(["src"]);

		expect(exitCode).toBe(2);
		expect(mockError.mock.calls).toMatchInlineSnapshot(`
			[
			  [
			    "Unexpected argument: src
			Run 'flint --help' for usage.",
			  ],
			]
		`);
	});

	it("should pass parsed values to a single run when --watch is not provided", async () => {
		const exitCode = await runCli([
			"--cache-location",
			"node_modules/.cache/flint",
			"--fix",
			"--fix-suggestions",
			"first",
			"--fix-suggestions",
			"second",
			"--presenter",
			"detailed",
			"--skip-formatting",
		]);
		const values = {
			"cache-location": "node_modules/.cache/flint",
			fix: true,
			"fix-suggestions": ["first", "second"],
			presenter: "detailed",
			"skip-formatting": true,
		};

		expect(exitCode).toBe(1);
		expect(createRendererFactory).toHaveBeenCalledWith(
			host,
			"flint.config.ts",
			values,
		);
		expect(runCliOnce).toHaveBeenCalledWith(
			ephemeralHost,
			"flint.config.ts",
			{ dispose: disposeRenderer },
			values,
		);
		expect(disposeRenderer).toHaveBeenCalled();
	});

	it("should pass parsed values and raw args to watch mode when --watch is provided", async () => {
		const args = ["--watch", "--interactive", "--cache-ignore"];

		const exitCode = await runCli(args);

		expect(exitCode).toBe(0);
		expect(runCliWatch).toHaveBeenCalledWith(
			host,
			"flint.config.ts",
			getRenderer,
			{ "cache-ignore": true, interactive: true, watch: true },
			args,
		);
		expect(mockLog).toHaveBeenCalledWith("👋 Thanks for using Flint!");
	});

	it("should add assertion context to errors thrown while running", async () => {
		const args = ["--fix"];
		const error = new Error("Oh no!");
		vi.mocked(runCliOnce).mockRejectedValueOnce(error);

		await expect(runCli(args)).rejects.toBe(error);
		expect(addFlintAssertionContext).toHaveBeenCalledWith(error, args);
	});
});
