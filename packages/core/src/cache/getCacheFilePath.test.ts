import path from "node:path";

import { describe, expect, it } from "vitest";

import { getCacheFilePath } from "./getCacheFilePath.ts";

const defaultCacheFileDirectory = path.join("node_modules", ".cache");
const defaultCacheFileName = "flint.json";
const defaultCacheFilePath = path.join(
	defaultCacheFileDirectory,
	defaultCacheFileName,
);

describe(getCacheFilePath, () => {
	it("should return the default cache path when no location is provided", () => {
		expect(getCacheFilePath()).toBe(defaultCacheFilePath);
	});

	it("should return the provided path unchanged when it ends with .json", () => {
		const provided = path.join("custom", "cache.json");

		expect(getCacheFilePath(provided)).toBe(provided);
	});

	it("should append the default filename when a directory is provided", () => {
		const providedDir = path.join("custom", "cache-dir");

		expect(getCacheFilePath(providedDir)).toBe(
			path.join(providedDir, defaultCacheFileName),
		);
	});

	it("should treat an empty string as not provided and return the default path", () => {
		expect(getCacheFilePath("")).toBe(defaultCacheFilePath);
	});

	it("should be case-insensitive when checking for the .json suffix", () => {
		const providedUpper = path.join("custom", "CACHE.JSON");

		expect(getCacheFilePath(providedUpper)).toBe(providedUpper);
	});
});
