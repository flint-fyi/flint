import { describe, expect, it } from "vitest";

import { normalizedDirname, normalizePath } from "./normalizePath.ts";

describe("normalizePath", () => {
	it("normalizes Windows path", () => {
		const normalized = normalizePath("C:\\my-PATH\\foo\\", false);

		expect(normalized).toEqual("c:/my-path/foo");
	});

	it("normalizes POSIX path", () => {
		const normalized = normalizePath("/my-PATH/foo/", true);

		expect(normalized).toEqual("/my-PATH/foo");
	});

	it("strips unnecessary path segments", () => {
		const normalized = normalizePath("/foo//bar/../baz/.//", true);

		expect(normalized).toEqual("/foo/baz");
	});

	it("doesn't strip root '/'", () => {
		const normalized = normalizePath("/", true);

		expect(normalized).toEqual("/");
	});

	it("doesn't strip root 'C:\\'", () => {
		const normalized = normalizePath("C:\\", false);

		expect(normalized).toEqual("c:/");
	});
});

describe("normalizedDirname", () => {
	it("works with Windows path", () => {
		const dirname = normalizedDirname("c:/foo/bar");

		expect(dirname).toEqual("c:/foo");
	});

	it("recognizes Windows root", () => {
		const dirname = normalizedDirname("c:/foo");

		expect(dirname).toEqual("c:/");
	});

	it("recognizes bare Windows root", () => {
		const dirname = normalizedDirname("c:/");

		expect(dirname).toEqual("c:/");
	});

	it("works with POSIX path", () => {
		const dirname = normalizedDirname("/foo/bar");

		expect(dirname).toEqual("/foo");
	});

	it("recognizes POSIX root", () => {
		const dirname = normalizedDirname("/foo");

		expect(dirname).toEqual("/");
	});

	it("recognizes bare POSIX root", () => {
		const dirname = normalizedDirname("/");

		expect(dirname).toEqual("/");
	});
});
