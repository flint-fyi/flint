import { stripVTControlCharacters } from "node:util";

import { afterEach, expect, it, vi } from "vitest";

import { printHeader } from "./printHeader.ts";

afterEach(() => {
	vi.unstubAllEnvs();
});

it("printHeader formats one-based positions and numeric totals", () => {
	vi.stubEnv("FORCE_COLOR", "3");
	vi.stubEnv("NO_COLOR", undefined);
	vi.stubEnv("NODE_DISABLE_COLORS", undefined);
	const output = printHeader(2, 12);

	expect(stripVTControlCharacters(output)).toBe(
		"📌 Displaying Flint reports in --interactive mode (file 3 of 12).",
	);
	expect(output).toContain("\u001B[38;2;187;204;255m3\u001B[39m");
	expect(output).toContain("\u001B[38;2;170;187;238m12\u001B[39m");
});
