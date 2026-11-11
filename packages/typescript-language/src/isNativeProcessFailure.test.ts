import { describe, expect, it } from "vitest";

import { isNativeProcessFailure } from "./isNativeProcessFailure.ts";

describe(isNativeProcessFailure, () => {
	it.each([
		"Unexpected EOF while reading from child process (unknown reason)",
		"EPIPE: broken pipe, write",
		"EBADF: bad file descriptor, write",
	])("returns true when the error message is %s", (message) => {
		expect(isNativeProcessFailure(new Error(message))).toBe(true);
	});

	it("returns true when an aggregated error is a process failure", () => {
		expect(
			isNativeProcessFailure(
				new AggregateError(
					[
						new Error("Could not parse TypeScript config"),
						new Error("EPIPE: broken pipe, write"),
					],
					"TypeScript project session failed to dispose.",
				),
			),
		).toBe(true);
	});

	it("returns false when the process answered with an error", () => {
		expect(
			isNativeProcessFailure(new Error("Could not parse TypeScript config")),
		).toBe(false);
	});

	it("returns false when the thrown value is not an error", () => {
		expect(isNativeProcessFailure("EPIPE")).toBe(false);
	});
});
