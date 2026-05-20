// @vitest/eslint-plugin doesn't recognize itProp.prop() as a test block.
/* eslint-disable vitest/no-standalone-expect */
import { fc, it as itProp } from "@fast-check/vitest";
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

	itProp.prop([pathArbitrary()])("is idempotent", (path) => {
		const once = normalizePath(path);
		const twice = normalizePath(once);

		expect(twice).toEqual(once);
	});

	itProp.prop([pathArbitrary()])("never contains backslashes", (path) => {
		const result = normalizePath(path);

		expect(result).not.toContain("\\");
	});

	itProp.prop([pathArbitrary()])(
		"only ends with '/' when at a root",
		(path) => {
			const result = normalizePath(path);
			if (!result.endsWith("/")) {
				return;
			}

			expect(result.indexOf("/")).toEqual(result.lastIndexOf("/"));
		},
	);
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

	itProp.prop([pathArbitrary()])(
		"is all lowercase when case-insensitive",
		(path) => {
			const key = pathKey(path, false);

			expect(key).toEqual(key.toLowerCase());
		},
	);

	itProp.prop([pathArbitrary(), fc.boolean()])(
		"is idempotent for both case modes",
		(path, caseSensitive) => {
			const once = pathKey(path, caseSensitive);
			const twice = pathKey(once, caseSensitive);

			expect(twice).toEqual(once);
		},
	);
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

function pathArbitrary() {
	const segment = fc.stringMatching(/^[\w.-]{1,8}$/);
	const separator = fc.constantFrom("/", "\\", "//", "\\\\");
	// fast-check's stringMatching doesn't support the `i` flag,
	// so the character class is spelled out explicitly.
	// eslint-disable-next-line regexp/use-ignore-case
	const drive = fc.option(fc.stringMatching(/^[A-Za-z]:[/\\]$/), { nil: "" });
	return fc
		.tuple(
			drive,
			fc.array(segment, { maxLength: 6, minLength: 1 }),
			separator,
			fc.boolean(),
		)
		.map(
			([prefix, segments, sep, trailing]) =>
				prefix + segments.join(sep) + (trailing ? sep : ""),
		);
}
