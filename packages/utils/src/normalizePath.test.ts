import { describe, expect, it } from "vitest";

import { normalizeDirname, normalizePath, pathKey } from "./normalizePath.ts";

describe("normalizePath", () => {
	it("normalizes Windows path", () => {
		const normalized = normalizePath("C:\\my-PATH\\foo\\");

		expect(normalized).toEqual("C:/my-PATH/foo");
	});

	it("normalizes POSIX path", () => {
		const normalized = normalizePath("/my-PATH/foo/");

		expect(normalized).toEqual("/my-PATH/foo");
	});

	it("strips unnecessary path segments", () => {
		const normalized = normalizePath("/foo//bar/../baz/.//");

		expect(normalized).toEqual("/foo/baz");
	});

	it("doesn't strip root '/'", () => {
		const normalized = normalizePath("/");

		expect(normalized).toEqual("/");
	});

	it("doesn't strip root 'C:\\'", () => {
		const normalized = normalizePath("C:\\");

		expect(normalized).toEqual("C:/");
	});
});

describe("pathKey", () => {
	it("preserves case on case-sensitive FS", () => {
		const key = pathKey("/My-PATH/Foo", true);

		expect(key).toEqual("/My-PATH/Foo");
	});

	it("lowercases on case-insensitive FS", () => {
		const key = pathKey("C:\\My-PATH\\Foo\\", false);

		expect(key).toEqual("c:/my-path/foo");
	});
});

describe("normalizedDirname", () => {
	it("works with Windows path", () => {
		const dirname = normalizeDirname("c:/foo/bar");

		expect(dirname).toEqual("c:/foo");
	});

	it("recognizes Windows root", () => {
		const dirname = normalizeDirname("c:/foo");

		expect(dirname).toEqual("c:/");
	});

	it("recognizes bare Windows root", () => {
		const dirname = normalizeDirname("c:/");

		expect(dirname).toEqual("c:/");
	});

	it("works with POSIX path", () => {
		const dirname = normalizeDirname("/foo/bar");

		expect(dirname).toEqual("/foo");
	});

	it("recognizes POSIX root", () => {
		const dirname = normalizeDirname("/foo");

		expect(dirname).toEqual("/");
	});

	it("recognizes bare POSIX root", () => {
		const dirname = normalizeDirname("/");

		expect(dirname).toEqual("/");
	});
});
