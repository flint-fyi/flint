import { stripVTControlCharacters, styleText } from "node:util";

import { afterEach, expect, it, vi } from "vitest";

import { wrapIfNeeded } from "./wrapIfNeeded.ts";

afterEach(() => {
	vi.unstubAllEnvs();
});

it("wrapIfNeeded preserves inner colors on continuation lines", () => {
	vi.stubEnv("FORCE_COLOR", "3");
	vi.stubEnv("NO_COLOR", undefined);
	vi.stubEnv("NODE_DISABLE_COLORS", undefined);
	const output = wrapIfNeeded(
		(text) => styleText("#bbeeff", text),
		"\u001B[38;2;187;204;221mReplace this long expression\u001B[39m",
		20,
	);

	expect(stripVTControlCharacters(output)).toBe(
		"Replace this long\n│  expression",
	);
	expect(output).toContain("\u001B[38;2;187;204;221mexpression");
});
