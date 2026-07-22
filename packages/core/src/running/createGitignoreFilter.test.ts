import path from "node:path/posix";

import { beforeEach, describe, expect, it } from "vitest";

import { createVFSLinterHost } from "../host/createVFSLinterHost.ts";
import type { VFSLinterHost } from "../types/host.ts";
import { createGitignoreFilter } from "./createGitignoreFilter.ts";

describe("createGitignoreFilter", () => {
	const integrationRoot = "/root";

	let host: VFSLinterHost;

	beforeEach(() => {
		host = createVFSLinterHost({
			caseSensitive: true,
			cwd: integrationRoot,
		});
	});

	it("returns true for files when no .gitignore exists", () => {
		const filePath = path.join(integrationRoot, "src", "file.ts");
		host.vfsUpsertFile(filePath, "content");

		const isNotIgnored = createGitignoreFilter(host);

		expect(isNotIgnored(filePath)).toBe(true);
	});

	it("ignores comments and empty lines", () => {
		host.vfsUpsertFile(
			path.join(integrationRoot, ".gitignore"),
			"# This is a comment\n\n*.log\n   \n# Another comment",
		);
		const logFile = path.join(integrationRoot, "debug.log");
		const tsFile = path.join(integrationRoot, "index.ts");

		const isNotIgnored = createGitignoreFilter(host);

		expect(isNotIgnored(logFile)).toBe(false);
		expect(isNotIgnored(tsFile)).toBe(true);
	});

	it("handles escaped hash at the beginning", () => {
		host.vfsUpsertFile(
			path.join(integrationRoot, ".gitignore"),
			"#comment.txt\n\\#real.txt",
		);
		const comment = path.join(integrationRoot, "comment.txt");
		const hashFile = path.join(integrationRoot, "#real.txt");

		const isNotIgnored = createGitignoreFilter(host);

		expect(isNotIgnored(comment)).toBe(true);
		expect(isNotIgnored(hashFile)).toBe(false);
	});

	it("handles non-escaped trailing spaces (automatically removed)", () => {
		host.vfsUpsertFile(
			path.join(integrationRoot, ".gitignore"),
			"*.log    ", // 4 trailing spaces (non-escaped)
		);
		const logFile = path.join(integrationRoot, "test.log");
		const txtFile = path.join(integrationRoot, "test.txt");

		const isNotIgnored = createGitignoreFilter(host);

		expect(isNotIgnored(logFile)).toBe(false);
		expect(isNotIgnored(txtFile)).toBe(true);
	});

	it("handles escaped trailing spaces", () => {
		host.vfsUpsertFile(
			path.join(integrationRoot, ".gitignore"),
			// First pattern: "file\ with\ space " (non-escaped trailing space, will be removed)
			// Second pattern: "file\ with\ escapedSpace\ " (escaped trailing space, will be kept)
			"file\\ with\\ space \nfile\\ with\\ escapedSpace\\ ",
		);

		const fileNoTrailingSpace = path.join(integrationRoot, "file with space");
		const fileWithExtraSpace = path.join(integrationRoot, "file with space ");

		const fileWithEscapedSpace = path.join(
			integrationRoot,
			"file with escapedSpace ",
		);

		const fileWithDifferentName = path.join(
			integrationRoot,
			"file with space.js",
		);
		const normalFile = path.join(integrationRoot, "normal.txt");

		const isNotIgnored = createGitignoreFilter(host);

		expect(isNotIgnored(fileNoTrailingSpace)).toBe(false);
		expect(isNotIgnored(fileWithExtraSpace)).toBe(true);
		expect(isNotIgnored(fileWithEscapedSpace)).toBe(false);
		expect(isNotIgnored(fileWithDifferentName)).toBe(true);
		expect(isNotIgnored(normalFile)).toBe(true);
	});

	it("treats leading spaces as part of the pattern", () => {
		host.vfsUpsertFile(path.join(integrationRoot, ".gitignore"), "  *.log");
		const logFile = path.join(integrationRoot, "test.log");
		const logFileWithSpaces = path.join(integrationRoot, "  test.log");
		const txtFile = path.join(integrationRoot, "test.txt");

		const isNotIgnored = createGitignoreFilter(host);

		expect(isNotIgnored(logFile)).toBe(true);
		expect(isNotIgnored(logFileWithSpaces)).toBe(false);
		expect(isNotIgnored(txtFile)).toBe(true);
	});

	it("handles negation patterns", () => {
		host.vfsUpsertFile(
			path.join(integrationRoot, ".gitignore"),
			"*.log\n!important.log",
		);
		const debugLog = path.join(integrationRoot, "debug.log");
		const importantLog = path.join(integrationRoot, "important.log");
		const importantLogNegated = path.join(integrationRoot, "!important.log");

		const isNotIgnored = createGitignoreFilter(host);

		expect(isNotIgnored(debugLog)).toBe(false);
		expect(isNotIgnored(importantLogNegated)).toBe(false);
		expect(isNotIgnored(importantLog)).toBe(true);
	});

	it("handles escaped exclamation mark at the beginning", () => {
		host.vfsUpsertFile(
			path.join(integrationRoot, ".gitignore"),
			"\\!literal.txt",
		);
		const literal = path.join(integrationRoot, "!literal.txt");

		const isNotIgnored = createGitignoreFilter(host);

		expect(isNotIgnored(literal)).toBe(false);
	});

	it("cannot re-include files when parent directory is excluded", () => {
		host.vfsUpsertFile(
			path.join(integrationRoot, ".gitignore"),
			"parent/\n!parent/child.txt",
		);
		const childFile = path.join(integrationRoot, "parent", "child.txt");
		const nestedFile = path.join(
			integrationRoot,
			"parent",
			"nested",
			"file.txt",
		);
		const otherFile = path.join(integrationRoot, "other.txt");

		const isNotIgnored = createGitignoreFilter(host);

		expect(isNotIgnored(childFile)).toBe(false);
		expect(isNotIgnored(nestedFile)).toBe(false);
		expect(isNotIgnored(otherFile)).toBe(true);
	});

	it("handles absolute path patterns with leading slash", () => {
		host.vfsUpsertFile(path.join(integrationRoot, ".gitignore"), "/build");
		const rootBuild = path.join(integrationRoot, "build", "output.js");
		const srcFile = path.join(integrationRoot, "src", "index.ts");
		const srcBuild = path.join(integrationRoot, "src", "build", "output.js");

		const isNotIgnored = createGitignoreFilter(host);

		expect(isNotIgnored(rootBuild)).toBe(false);
		expect(isNotIgnored(srcFile)).toBe(true);
		expect(isNotIgnored(srcBuild)).toBe(true);
	});

	it("handles trailing slash (directories only)", () => {
		host.vfsUpsertFile(path.join(integrationRoot, ".gitignore"), "build/");
		const buildDir = path.join(integrationRoot, "build", "output.js");
		const buildLiteralFile = path.join(integrationRoot, "build");
		const buildJsFile = path.join(integrationRoot, "build.js");
		const nestedBuildDir = path.join(
			integrationRoot,
			"src",
			"build",
			"file.js",
		);

		const isNotIgnored = createGitignoreFilter(host);

		expect(isNotIgnored(buildDir)).toBe(false);
		expect(isNotIgnored(buildLiteralFile)).toBe(true);
		expect(isNotIgnored(buildJsFile)).toBe(true);
		expect(isNotIgnored(nestedBuildDir)).toBe(false);
	});

	it("handles leading and trailing slash (anchored directory)", () => {
		host.vfsUpsertFile(path.join(integrationRoot, ".gitignore"), "/build/");
		const buildDir = path.join(integrationRoot, "build", "output.js");
		const buildFile = path.join(integrationRoot, "build.js");
		const nestedBuildDir = path.join(
			integrationRoot,
			"src",
			"build",
			"file.js",
		);

		const isNotIgnored = createGitignoreFilter(host);

		expect(isNotIgnored(buildDir)).toBe(false);
		expect(isNotIgnored(buildFile)).toBe(true);
		expect(isNotIgnored(nestedBuildDir)).toBe(true);
	});

	it("handles patterns with slash in the middle", () => {
		const srcDir = path.join(integrationRoot, "src");
		host.vfsUpsertFile(path.join(srcDir, ".gitignore"), "foo/bar.js");

		const directMatch = path.join(srcDir, "foo", "bar.js");
		const nestedMatch = path.join(srcDir, "nested", "foo", "bar.js");
		const otherFile = path.join(srcDir, "baz.js");

		const isNotIgnored = createGitignoreFilter(host);

		expect(isNotIgnored(directMatch)).toBe(false);
		expect(isNotIgnored(nestedMatch)).toBe(true);
		expect(isNotIgnored(otherFile)).toBe(true);
	});

	it("handles patterns without slash (match at any level)", () => {
		const srcDir = path.join(integrationRoot, "src");
		host.vfsUpsertFile(path.join(srcDir, ".gitignore"), "*.js");

		const directFile = path.join(srcDir, "baz.js");
		const nestedFile = path.join(srcDir, "foo", "bar.js");
		const deepFile = path.join(srcDir, "nested", "deep", "test.js");

		const isNotIgnored = createGitignoreFilter(host);

		expect(isNotIgnored(directFile)).toBe(false);
		expect(isNotIgnored(nestedFile)).toBe(false);
		expect(isNotIgnored(deepFile)).toBe(false);
	});

	it("handles asterisk wildcard", () => {
		host.vfsUpsertFile(
			path.join(integrationRoot, ".gitignore"),
			"*.log\ndist/",
		);
		const logFile = path.join(integrationRoot, "debug.log");
		const distFile = path.join(integrationRoot, "dist", "bundle.js");
		const srcFile = path.join(integrationRoot, "src", "index.ts");

		const isNotIgnored = createGitignoreFilter(host);

		expect(isNotIgnored(logFile)).toBe(false);
		expect(isNotIgnored(distFile)).toBe(false);
		expect(isNotIgnored(srcFile)).toBe(true);
	});

	it("handles wildcards and character ranges", () => {
		host.vfsUpsertFile(
			path.join(integrationRoot, ".gitignore"),
			"test?.js\nfile[0-9].txt",
		);
		const test1 = path.join(integrationRoot, "test1.js");
		const test2 = path.join(integrationRoot, "test2.js");
		const testNoChar = path.join(integrationRoot, "test.js");
		const testTwoChars = path.join(integrationRoot, "test12.js");
		const file1 = path.join(integrationRoot, "file1.txt");
		const file5 = path.join(integrationRoot, "file5.txt");
		const fileA = path.join(integrationRoot, "fileA.txt");
		const other = path.join(integrationRoot, "other.js");

		const isNotIgnored = createGitignoreFilter(host);

		expect(isNotIgnored(test1)).toBe(false);
		expect(isNotIgnored(test2)).toBe(false);
		expect(isNotIgnored(testNoChar)).toBe(true);
		expect(isNotIgnored(testTwoChars)).toBe(true);
		expect(isNotIgnored(file1)).toBe(false);
		expect(isNotIgnored(file5)).toBe(false);
		expect(isNotIgnored(fileA)).toBe(true);
		expect(isNotIgnored(other)).toBe(true);
	});

	it("handles leading double asterisk pattern", () => {
		host.vfsUpsertFile(path.join(integrationRoot, ".gitignore"), "**/foo");
		const rootFoo = path.join(integrationRoot, "foo");
		const barFoo = path.join(integrationRoot, "bar", "foo");
		const deepFoo = path.join(integrationRoot, "deep", "nested", "foo");
		const otherFile = path.join(integrationRoot, "other.txt");

		const isNotIgnored = createGitignoreFilter(host);

		expect(isNotIgnored(rootFoo)).toBe(false);
		expect(isNotIgnored(barFoo)).toBe(false);
		expect(isNotIgnored(deepFoo)).toBe(false);
		expect(isNotIgnored(otherFile)).toBe(true);
	});

	it("handles trailing double asterisk pattern", () => {
		host.vfsUpsertFile(path.join(integrationRoot, ".gitignore"), "abc/**");
		const abcFile = path.join(integrationRoot, "abc", "file.js");
		const abcDeep = path.join(integrationRoot, "abc", "deep", "nested.js");
		const otherFile = path.join(integrationRoot, "other.js");

		const isNotIgnored = createGitignoreFilter(host);

		expect(isNotIgnored(abcFile)).toBe(false);
		expect(isNotIgnored(abcDeep)).toBe(false);
		expect(isNotIgnored(otherFile)).toBe(true);
	});

	it("handles middle double asterisk pattern", () => {
		host.vfsUpsertFile(path.join(integrationRoot, ".gitignore"), "a/**/b");
		const aB = path.join(integrationRoot, "a", "b");
		const aXB = path.join(integrationRoot, "a", "x", "b");
		const aXYB = path.join(integrationRoot, "a", "x", "y", "b");
		const other = path.join(integrationRoot, "other");

		const isNotIgnored = createGitignoreFilter(host);

		expect(isNotIgnored(aB)).toBe(false);
		expect(isNotIgnored(aXB)).toBe(false);
		expect(isNotIgnored(aXYB)).toBe(false);
		expect(isNotIgnored(other)).toBe(true);
	});

	it("handles nested .gitignore files", () => {
		host.vfsUpsertFile(path.join(integrationRoot, ".gitignore"), "*.log");
		const srcDir = path.join(integrationRoot, "src");
		host.vfsUpsertFile(path.join(srcDir, ".gitignore"), "temp/");

		const rootLog = path.join(integrationRoot, "root.log");
		const srcLog = path.join(srcDir, "src.log");
		const srcTemp = path.join(srcDir, "temp", "cache.txt");
		const srcFile = path.join(srcDir, "index.ts");

		const isNotIgnored = createGitignoreFilter(host);

		expect(isNotIgnored(rootLog)).toBe(false);
		expect(isNotIgnored(srcLog)).toBe(false);
		expect(isNotIgnored(srcTemp)).toBe(false);
		expect(isNotIgnored(srcFile)).toBe(true);
	});

	it("handles negation with leading slash in subdirectory", () => {
		const srcDir = path.join(integrationRoot, "src");
		host.vfsUpsertFile(
			path.join(srcDir, ".gitignore"),
			"*.generated.ts\n!/keep.generated.ts",
		);

		const ignoredFile = path.join(srcDir, "api.generated.ts");
		const keptFile = path.join(srcDir, "keep.generated.ts");

		const isNotIgnored = createGitignoreFilter(host);

		expect(isNotIgnored(ignoredFile)).toBe(false);
		expect(isNotIgnored(keptFile)).toBe(true);
	});

	it("handles unanchored pattern in nested .gitignore (should match any depth)", () => {
		const srcDir = path.join(integrationRoot, "src");
		host.vfsUpsertFile(path.join(srcDir, ".gitignore"), "dist");

		const srcDist = path.join(srcDir, "dist", "bundle.js");
		const nestedDist = path.join(srcDir, "nested", "dist", "bundle.js");

		const isNotIgnored = createGitignoreFilter(host);

		expect(isNotIgnored(srcDist)).toBe(false);
		expect(isNotIgnored(nestedDist)).toBe(false);
	});
});
