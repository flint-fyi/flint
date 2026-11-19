import { PassThrough } from "node:stream";
import { stripVTControlCharacters } from "node:util";

import { afterEach, describe, expect, it, vi } from "vitest";

const initializeContext = {
	configDirectory: process.cwd(),
	configFileName: "flint.config.ts",
	ignoreCache: false,
	runMode: "single-run" as const,
};

describe("detailedPresenterFactory", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
	});

	it.each([
		{ columns: 0, footerWidth: 18 },
		{ columns: undefined, footerWidth: 18 },
		{ columns: 1, footerWidth: 1 },
		{ columns: 2, footerWidth: 1 },
		{ columns: 3, footerWidth: 1 },
		{ columns: 16, footerWidth: 14 },
		{ columns: 80, footerWidth: 18 },
	])(
		"renders a report with $columns terminal columns",
		async ({ columns, footerWidth }) => {
			vi.stubEnv("FORCE_COLOR", "3");
			vi.stubEnv("NO_COLOR", undefined);
			vi.stubEnv("NODE_DISABLE_COLORS", undefined);
			vi.resetModules();
			vi.spyOn(process, "stdout", "get").mockReturnValue(
				Object.assign(new PassThrough(), {
					columns,
				}) as unknown as typeof process.stdout,
			);
			const { detailedPresenterFactory } =
				await import("./detailedPresenterFactory.ts");
			const presenter = detailedPresenterFactory.initialize(initializeContext);
			const output = stripVTControlCharacters(
				(
					await Array.fromAsync(
						presenter.renderFile({
							file: { filePath: "example.ts", text: "debugger;" },
							reports: [
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
							],
						}),
					)
				).join(""),
			);

			expect(output).toContain("debugger;");
			expect(output).toContain("Example");
			expect(output).toContain("Remove");
			expect(output).toContain(`\n╰${"─".repeat(footerWidth)}\n`);
		},
	);
});
