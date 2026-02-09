import path from "node:path";
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

		const gitignoreFilter = createGitignoreFilter(integrationRoot, host);
		expect(gitignoreFilter(filePath)).toBe(true);
	});

	it("ignores comments and empty lines", () => {
		host.vfsUpsertFile(
			path.join(integrationRoot, ".gitignore"),
			"# This is a comment\n\n*.log\n   \n# Another comment",
		);
		const logFile = path.join(integrationRoot, "debug.log");
		const tsFile = path.join(integrationRoot, "index.ts");

		const gitignoreFilter = createGitignoreFilter(integrationRoot, host);
		expect(gitignoreFilter(logFile)).toBe(false);
		expect(gitignoreFilter(tsFile)).toBe(true);
	});

	it("handles escaped hash at the beginning", () => {
		host.vfsUpsertFile(
			path.join(integrationRoot, ".gitignore"),
			"#comment.txt\n\\#real.txt",
		);
		const comment = path.join(integrationRoot, "comment.txt");
		const hashFile = path.join(integrationRoot, "#real.txt");

		const gitignoreFilter = createGitignoreFilter(integrationRoot, host);
		expect(gitignoreFilter(comment)).toBe(true);
		expect(gitignoreFilter(hashFile)).toBe(false);
	});

	it("handles non-escaped trailing spaces (automatically removed)", () => {
		host.vfsUpsertFile(
			path.join(integrationRoot, ".gitignore"),
			"*.log    ", // 4 trailing spaces (non-escaped)
		);
		const logFile = path.join(integrationRoot, "test.log");
		const txtFile = path.join(integrationRoot, "test.txt");

		const gitignoreFilter = createGitignoreFilter(integrationRoot, host);
		expect(gitignoreFilter(logFile)).toBe(false);
		expect(gitignoreFilter(txtFile)).toBe(true);
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

		const gitignoreFilter = createGitignoreFilter(integrationRoot, host);

		expect(gitignoreFilter(fileNoTrailingSpace)).toBe(false);
		expect(gitignoreFilter(fileWithExtraSpace)).toBe(true);
		expect(gitignoreFilter(fileWithEscapedSpace)).toBe(false);
		expect(gitignoreFilter(fileWithDifferentName)).toBe(true);
		expect(gitignoreFilter(normalFile)).toBe(true);
	});

	it("treats leading spaces as part of the pattern", () => {
		host.vfsUpsertFile(path.join(integrationRoot, ".gitignore"), "  *.log");
		const logFile = path.join(integrationRoot, "test.log");
		const logFileWithSpaces = path.join(integrationRoot, "  test.log");
		const txtFile = path.join(integrationRoot, "test.txt");

		const gitignoreFilter = createGitignoreFilter(integrationRoot, host);
		expect(gitignoreFilter(logFile)).toBe(true);
		expect(gitignoreFilter(logFileWithSpaces)).toBe(false);
		expect(gitignoreFilter(txtFile)).toBe(true);
	});

	it("handles negation patterns", () => {
		host.vfsUpsertFile(
			path.join(integrationRoot, ".gitignore"),
			"*.log\n!important.log",
		);
		const debugLog = path.join(integrationRoot, "debug.log");
		const importantLog = path.join(integrationRoot, "important.log");
		const importantLogNegated = path.join(integrationRoot, "!important.log");

		const gitignoreFilter = createGitignoreFilter(integrationRoot, host);
		expect(gitignoreFilter(debugLog)).toBe(false);
		expect(gitignoreFilter(importantLogNegated)).toBe(false);
		expect(gitignoreFilter(importantLog)).toBe(true);
	});

	it("handles escaped exclamation mark at the beginning", () => {
		host.vfsUpsertFile(
			path.join(integrationRoot, ".gitignore"),
			"\\!literal.txt",
		);
		const literal = path.join(integrationRoot, "!literal.txt");

		const gitignoreFilter = createGitignoreFilter(integrationRoot, host);
		expect(gitignoreFilter(literal)).toBe(false);
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

		const gitignoreFilter = createGitignoreFilter(integrationRoot, host);
		expect(gitignoreFilter(childFile)).toBe(false);
		expect(gitignoreFilter(nestedFile)).toBe(false);
		expect(gitignoreFilter(otherFile)).toBe(true);
	});

	it("handles absolute path patterns with leading slash", () => {
		host.vfsUpsertFile(path.join(integrationRoot, ".gitignore"), "/build");
		const rootBuild = path.join(integrationRoot, "build", "output.js");
		const srcFile = path.join(integrationRoot, "src", "index.ts");
		const srcBuild = path.join(integrationRoot, "src", "build", "output.js");

		const gitignoreFilter = createGitignoreFilter(integrationRoot, host);
		expect(gitignoreFilter(rootBuild)).toBe(false);
		expect(gitignoreFilter(srcFile)).toBe(true);
		expect(gitignoreFilter(srcBuild)).toBe(true);
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

		const gitignoreFilter = createGitignoreFilter(integrationRoot, host);
		expect(gitignoreFilter(buildDir)).toBe(false);
		expect(gitignoreFilter(buildLiteralFile)).toBe(true);
		expect(gitignoreFilter(buildJsFile)).toBe(true);
		expect(gitignoreFilter(nestedBuildDir)).toBe(false);
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

		const gitignoreFilter = createGitignoreFilter(integrationRoot, host);
		expect(gitignoreFilter(buildDir)).toBe(false);
		expect(gitignoreFilter(buildFile)).toBe(true);
		expect(gitignoreFilter(nestedBuildDir)).toBe(true);
	});

	it("handles patterns with slash in the middle", () => {
		const srcDir = path.join(integrationRoot, "src");
		host.vfsUpsertFile(path.join(srcDir, ".gitignore"), "foo/bar.js");

		const directMatch = path.join(srcDir, "foo", "bar.js");
		const nestedMatch = path.join(srcDir, "nested", "foo", "bar.js");
		const otherFile = path.join(srcDir, "baz.js");

		const gitignoreFilter = createGitignoreFilter(integrationRoot, host);
		expect(gitignoreFilter(directMatch)).toBe(false);
		expect(gitignoreFilter(nestedMatch)).toBe(true);
		expect(gitignoreFilter(otherFile)).toBe(true);
	});

	it("handles patterns without slash (match at any level)", () => {
		const srcDir = path.join(integrationRoot, "src");
		host.vfsUpsertFile(path.join(srcDir, ".gitignore"), "*.js");

		const directFile = path.join(srcDir, "baz.js");
		const nestedFile = path.join(srcDir, "foo", "bar.js");
		const deepFile = path.join(srcDir, "nested", "deep", "test.js");

		const gitignoreFilter = createGitignoreFilter(integrationRoot, host);
		expect(gitignoreFilter(directFile)).toBe(false);
		expect(gitignoreFilter(nestedFile)).toBe(false);
		expect(gitignoreFilter(deepFile)).toBe(false);
	});

	it("handles asterisk wildcard", () => {
		host.vfsUpsertFile(
			path.join(integrationRoot, ".gitignore"),
			"*.log\ndist/",
		);
		const logFile = path.join(integrationRoot, "debug.log");
		const distFile = path.join(integrationRoot, "dist", "bundle.js");
		const srcFile = path.join(integrationRoot, "src", "index.ts");

		const gitignoreFilter = createGitignoreFilter(integrationRoot, host);
		expect(gitignoreFilter(logFile)).toBe(false);
		expect(gitignoreFilter(distFile)).toBe(false);
		expect(gitignoreFilter(srcFile)).toBe(true);
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

		const gitignoreFilter = createGitignoreFilter(integrationRoot, host);
		expect(gitignoreFilter(test1)).toBe(false);
		expect(gitignoreFilter(test2)).toBe(false);
		expect(gitignoreFilter(testNoChar)).toBe(true);
		expect(gitignoreFilter(testTwoChars)).toBe(true);
		expect(gitignoreFilter(file1)).toBe(false);
		expect(gitignoreFilter(file5)).toBe(false);
		expect(gitignoreFilter(fileA)).toBe(true);
		expect(gitignoreFilter(other)).toBe(true);
	});

	it("handles leading double asterisk pattern", () => {
		host.vfsUpsertFile(path.join(integrationRoot, ".gitignore"), "**/foo");
		const rootFoo = path.join(integrationRoot, "foo");
		const barFoo = path.join(integrationRoot, "bar", "foo");
		const deepFoo = path.join(integrationRoot, "deep", "nested", "foo");
		const otherFile = path.join(integrationRoot, "other.txt");

		const gitignoreFilter = createGitignoreFilter(integrationRoot, host);
		expect(gitignoreFilter(rootFoo)).toBe(false);
		expect(gitignoreFilter(barFoo)).toBe(false);
		expect(gitignoreFilter(deepFoo)).toBe(false);
		expect(gitignoreFilter(otherFile)).toBe(true);
	});

	it("handles trailing double asterisk pattern", () => {
		host.vfsUpsertFile(path.join(integrationRoot, ".gitignore"), "abc/**");
		const abcFile = path.join(integrationRoot, "abc", "file.js");
		const abcDeep = path.join(integrationRoot, "abc", "deep", "nested.js");
		const otherFile = path.join(integrationRoot, "other.js");

		const gitignoreFilter = createGitignoreFilter(integrationRoot, host);
		expect(gitignoreFilter(abcFile)).toBe(false);
		expect(gitignoreFilter(abcDeep)).toBe(false);
		expect(gitignoreFilter(otherFile)).toBe(true);
	});

	it("handles middle double asterisk pattern", () => {
		host.vfsUpsertFile(path.join(integrationRoot, ".gitignore"), "a/**/b");
		const aB = path.join(integrationRoot, "a", "b");
		const aXB = path.join(integrationRoot, "a", "x", "b");
		const aXYB = path.join(integrationRoot, "a", "x", "y", "b");
		const other = path.join(integrationRoot, "other");

		const gitignoreFilter = createGitignoreFilter(integrationRoot, host);
		expect(gitignoreFilter(aB)).toBe(false);
		expect(gitignoreFilter(aXB)).toBe(false);
		expect(gitignoreFilter(aXYB)).toBe(false);
		expect(gitignoreFilter(other)).toBe(true);
	});

	it("handles nested .gitignore files", () => {
		host.vfsUpsertFile(path.join(integrationRoot, ".gitignore"), "*.log");
		const srcDir = path.join(integrationRoot, "src");
		host.vfsUpsertFile(path.join(srcDir, ".gitignore"), "temp/");

		const rootLog = path.join(integrationRoot, "root.log");
		const srcLog = path.join(srcDir, "src.log");
		const srcTemp = path.join(srcDir, "temp", "cache.txt");
		const srcFile = path.join(srcDir, "index.ts");

		const gitignoreFilter = createGitignoreFilter(integrationRoot, host);
		expect(gitignoreFilter(rootLog)).toBe(false);
		expect(gitignoreFilter(srcLog)).toBe(false);
		expect(gitignoreFilter(srcTemp)).toBe(false);
		expect(gitignoreFilter(srcFile)).toBe(true);
	});

	it("handles negation with leading slash in subdirectory", () => {
		const srcDir = path.join(integrationRoot, "src");
		host.vfsUpsertFile(
			path.join(srcDir, ".gitignore"),
			"*.generated.ts\n!/keep.generated.ts",
		);

		const ignoredFile = path.join(srcDir, "api.generated.ts");
		const keptFile = path.join(srcDir, "keep.generated.ts");

		const gitignoreFilter = createGitignoreFilter(integrationRoot, host);
		expect(gitignoreFilter(ignoredFile)).toBe(false);
		expect(gitignoreFilter(keptFile)).toBe(true);
	});

	it("handles unanchored pattern in nested .gitignore (should match any depth)", () => {
		const srcDir = path.join(integrationRoot, "src");
		host.vfsUpsertFile(path.join(srcDir, ".gitignore"), "dist");

		const srcDist = path.join(srcDir, "dist", "bundle.js");
		const nestedDist = path.join(srcDir, "nested", "dist", "bundle.js");

		const gitignoreFilter = createGitignoreFilter(integrationRoot, host);
		expect(gitignoreFilter(srcDist)).toBe(false);
		expect(gitignoreFilter(nestedDist)).toBe(false);
	});
});
