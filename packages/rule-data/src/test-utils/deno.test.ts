import { afterEach, describe, expect, it, vi } from "vitest";

import { getDenoLintRules } from "./deno.ts";

afterEach(() => {
	vi.restoreAllMocks();
});

describe(getDenoLintRules, () => {
	it("extracts built-in rules without treating custom rule patterns as rules", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
			Response.json({
				oneOf: [
					{ pattern: "^[a-z0-9-]+/[a-z0-9-]+$", type: "string" },
					{ enum: ["no-debugger", "eqeqeq"] },
				],
			}),
		);

		await expect(getDenoLintRules()).resolves.toEqual([
			"no-debugger",
			"eqeqeq",
		]);
		expect(fetch).toHaveBeenCalledWith(
			expect.stringMatching(
				/^https:\/\/raw\.githubusercontent\.com\/denoland\/deno\/v\d+\.\d+\.\d+\/cli\/schemas\/lint-rules\.v1\.json$/,
			),
		);
	});

	it("rejects failed requests", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
			new Response(undefined, { status: 404 }),
		);

		await expect(getDenoLintRules()).rejects.toThrow(
			"Could not fetch Deno lint rules: 404.",
		);
	});

	it("rejects schemas without built-in rule names", async () => {
		vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(Response.json({}));

		await expect(getDenoLintRules()).rejects.toThrow();
	});
});
