import { stripVTControlCharacters, styleText } from "node:util";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { printControls } from "../renderers/interactive/printControls.ts";
import { printHeader } from "../renderers/interactive/printHeader.ts";
import { formatSuggestion } from "./detailed/formatSuggestion.ts";
import { wrapIfNeeded } from "./detailed/wrapIfNeeded.ts";
import { presentHeader } from "./shared/header.ts";

describe("terminal styling", () => {
	beforeEach(() => {
		vi.stubEnv("FORCE_COLOR", "3");
		vi.stubEnv("NO_COLOR", undefined);
		vi.stubEnv("NODE_DISABLE_COLORS", undefined);
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("formats numeric interactive positions and Unicode text", () => {
		const output = printHeader(2, 12);
		expect(stripVTControlCharacters(output)).toBe(
			"📌 Displaying Flint reports in --interactive mode (file 3 of 12).",
		);
		expect(output).toContain("\u001B[38;2;187;204;255m3\u001B[39m");
		expect(output).toContain("\u001B[38;2;170;187;238m12\u001B[39m");
	});

	it("distinguishes disabled controls at either boundary", () => {
		expect(printControls(0, 3)).toContain(
			"\u001B[38;2;170;170;170m[<] previous file\u001B[39m",
		);
		expect(printControls(0, 3)).toContain(
			"\u001B[38;2;221;221;221m[>] next file\u001B[39m",
		);
		expect(printControls(2, 3)).toContain(
			"\u001B[38;2;170;170;170m[>] next file\u001B[39m",
		);
	});

	it("restores the header color after its nested bold cyan filename", () => {
		expect(
			Array.from(
				presentHeader({
					configFileName: "配置.ts",
					ignoreCache: false,
					runMode: "single-run",
				}),
			).join(""),
		).toBe(
			"\u001B[90mLinting with \u001B[36m\u001B[1m配置.ts\u001B[22m\u001B[90m...\u001B[39m",
		);
	});

	it("retains nested suggestion colors across wrapped and explicit newlines", () => {
		const output = wrapIfNeeded(
			(text) => styleText("#bbeeff", text),
			formatSuggestion(
				undefined,
				"Replace this long expression with `some replacement` instead.\n保留 👩🏽‍💻 é",
			),
			20,
		);
		expect(stripVTControlCharacters(output)).toBe(
			"Replace this long\n│  expression with\n│  `some replacement`\n│  instead.\n│  保留 👩🏽‍💻 é",
		);
		expect(output).toContain("\u001B[38;2;187;204;221mexpression with");
		expect(output).toContain("\u001B[38;2;187;238;255msome replacement");
		expect(output).toContain("\u001B[38;2;187;204;221m保留");
	});
});
