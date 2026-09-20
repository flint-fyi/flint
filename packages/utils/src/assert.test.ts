import { describe, expect, it } from "vitest";

import {
	addFlintAssertionContext,
	assert,
	FlintAssertionError,
	nullThrows,
	sanitizeStackTrace,
} from "./assert.ts";

describe("FlintAssertionError", () => {
	it("prefixes the message and keeps the assertion message", () => {
		const error = new FlintAssertionError("MSG");

		expect(error.message).toBe("Flint bug: MSG.");
		expect(error.assertionMessage).toBe("MSG");
		expect(error.name).toBe("FlintAssertionError");
		expect(error.stack).toMatch(/^FlintAssertionError: Flint bug: MSG\./);
	});
});

describe("addFlintAssertionContext", () => {
	it("enriches the same error while preserving cached stack frames", () => {
		const error = new FlintAssertionError("First line\nSecond line");
		const originalStack = nullThrows(error.stack, "Expected a stack");
		const originalHeader = `${error.name}: ${error.message}`;

		expect(addFlintAssertionContext(error, ["--fix", "--watch"])).toBe(error);
		expect(error.stack).toBe(
			`${error.name}: ${error.message}` +
				originalStack.slice(originalHeader.length),
		);
		const issueUrl = new URL(
			nullThrows(
				error.message.split("Please report it here: ")[1],
				"Expected a report URL",
			),
		);
		expect(issueUrl.searchParams.get("title")).toBe(
			"🐛 Bug: First line\nSecond line",
		);
		expect(issueUrl.searchParams.get("additional_info")).toBe(
			"Process arguments:\n\n`--fix --watch`",
		);
		expect(issueUrl.searchParams.get("actual")).not.toContain(
			"Please report it here:",
		);
	});

	it("enriches errors without a stack", () => {
		const error = new FlintAssertionError("MSG");
		error.stack = undefined;

		addFlintAssertionContext(error, []);

		expect(error.message).toContain(
			"Please report it here: https://github.com/",
		);
		expect(error.stack).toBeUndefined();
	});

	it("leaves ordinary errors unchanged", () => {
		const error = new Error("ordinary error");
		const originalStack = error.stack;

		expect(addFlintAssertionContext(error, ["--fix"])).toBe(error);
		expect(error.message).toBe("ordinary error");
		expect(error.stack).toBe(originalStack);
	});

	it.each(["thrown string", undefined])(
		"leaves non-assertion failures unchanged: %s",
		(error) => {
			expect(addFlintAssertionContext(error, ["--fix"])).toBe(error);
		},
	);

	it("reports <none> for an empty argument list", () => {
		const error = new FlintAssertionError("MSG");
		addFlintAssertionContext(error, []);

		expect(decodeURIComponent(error.message)).toContain("`<none>`");
	});

	it("censors file paths in the stack trace", () => {
		const error = new FlintAssertionError("MSG");
		error.stack =
			"Error: Boom\n    at doThing (/home/me/proj/src/index.ts:10:5)";

		addFlintAssertionContext(error, []);

		expect(decodeURIComponent(error.message)).toContain("<censored+filename>");
		expect(decodeURIComponent(error.message)).not.toContain("/home/me");
	});
});

describe("assert", () => {
	it("throws on null", () => {
		expect(() => {
			assert(null, "MSG");
		}).toThrow("MSG");
	});

	it("throws on undefined", () => {
		expect(() => {
			assert(undefined, "MSG");
		}).toThrow("MSG");
	});

	it("throws on false", () => {
		expect(() => {
			assert(false, "MSG");
		}).toThrow("MSG");
	});

	it("doesn't throw on true", () => {
		expect(() => {
			assert(true, "MSG");
		}).not.toThrow();
	});

	it("doesn't throw on obj", () => {
		expect(() => {
			assert({}, "MSG");
		}).not.toThrow();
	});
});

describe("nullThrows", () => {
	it("throws on null", () => {
		expect(() => nullThrows(null, "MSG")).toThrow("MSG");
	});

	it("throws on undefined", () => {
		expect(() => nullThrows(undefined, "MSG")).toThrow("MSG");
	});

	it("doesn't throw on false", () => {
		expect(() => nullThrows(false, "MSG")).not.toThrow();
	});

	it("doesn't throw on obj", () => {
		expect(() => nullThrows({}, "MSG")).not.toThrow();
	});
});

describe("sanitizeStackTrace", () => {
	it("strips absolute paths to filenames", () => {
		const stack = `Error: Boom
    at doThing (/home/me/proj/packages/foo/src/index.ts:10:5)
    at other (C:\\Users\\me\\proj\\packages\\bar\\src\\main.ts:20:1)`;

		expect(sanitizeStackTrace(stack)).toBe(
			`Error: Boom
    at doThing (<censored filename>)
    at other (<censored filename>)`,
		);
	});

	it("preserves node_modules paths", () => {
		const stack = `Error: Boom
    at doThing (file:///home/me/proj/node_modules/bar/dist/index.js:10:5)
    at other (file:///home/me/.pnpm/store/node_modules/baz/lib/main.js:3:1)`;

		expect(sanitizeStackTrace(stack)).toBe(
			`Error: Boom
    at doThing (file:node_modules/bar/dist/index.js:10:5)
    at other (file:node_modules/baz/lib/main.js:3:1)`,
		);
	});
});
