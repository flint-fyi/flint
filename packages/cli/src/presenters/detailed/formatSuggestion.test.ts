import { afterEach, expect, it, vi } from "vitest";

import { formatSuggestion } from "./formatSuggestion.ts";

afterEach(() => {
	vi.unstubAllEnvs();
});

it("formatSuggestion highlights backticks and reopens multiline colors", () => {
	vi.stubEnv("FORCE_COLOR", "3");
	vi.stubEnv("NO_COLOR", undefined);
	vi.stubEnv("NODE_DISABLE_COLORS", undefined);
	const output = formatSuggestion(undefined, "Use `first\nsecond`.\n保留 👩🏽‍💻");

	expect(output).toContain("\u001B[38;2;187;238;255mfirst");
	expect(output).toContain("\n\u001B[38;2;187;238;255msecond");
	expect(output).toContain("\n\u001B[38;2;187;204;221m保留 👩🏽‍💻");
});
