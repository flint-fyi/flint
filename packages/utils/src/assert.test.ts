import { describe, expect, it } from "vitest";

import { assert, nullThrows, sanitizeStackTrace } from "./assert.ts";

describe("assert", () => {
	it("throws on null", () => {
		expect(() => {
			assert(null, "MSG");
		}).toThrowError("MSG");
	});

	it("throws on undefined", () => {
		expect(() => {
			assert(undefined, "MSG");
		}).toThrowError("MSG");
	});

	it("throws on false", () => {
		expect(() => {
			assert(false, "MSG");
		}).toThrowError("MSG");
	});

	it("doesn't throw on true", () => {
		expect(() => {
			assert(true, "MSG");
		}).not.toThrowError();
	});

	it("doesn't throw on obj", () => {
		expect(() => {
			assert({}, "MSG");
		}).not.toThrowError();
	});
});

describe("nullThrows", () => {
	it("throws on null", () => {
		expect(() => nullThrows(null, "MSG")).toThrowError("MSG");
	});

	it("throws on undefined", () => {
		expect(() => nullThrows(undefined, "MSG")).toThrowError("MSG");
	});

	it("doesn't throw on false", () => {
		expect(() => nullThrows(false, "MSG")).not.toThrowError();
	});

	it("doesn't throw on obj", () => {
		expect(() => nullThrows({}, "MSG")).not.toThrowError();
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
