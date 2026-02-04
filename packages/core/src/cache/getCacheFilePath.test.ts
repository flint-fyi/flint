import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { getCacheFilePath } from "./getCacheFilePath.ts";

const defaultCacheFileDirectory = join("node_modules", ".cache");
const defaultCacheFileName = "flint.json";
const defaultCacheFilePath = join(
	defaultCacheFileDirectory,
	defaultCacheFileName,
);

describe(getCacheFilePath, () => {
	it("should return the default cache path when no location is provided", () => {
		expect(getCacheFilePath()).toBe(defaultCacheFilePath);
	});

	it("should return the provided path unchanged when it ends with .json", () => {
		const provided = join("custom", "cache.json");
		expect(getCacheFilePath(provided)).toBe(provided);
	});

	it("should append the default filename when a directory is provided", () => {
		const providedDir = join("custom", "cache-dir");
		expect(getCacheFilePath(providedDir)).toBe(
			join(providedDir, defaultCacheFileName),
		);
	});

	it("should treat an empty string as not provided and return the default path", () => {
		expect(getCacheFilePath("")).toBe(defaultCacheFilePath);
	});

	it("should be case-insensitive when checking for the .json suffix", () => {
		const providedUpper = join("custom", "CACHE.JSON");
		expect(getCacheFilePath(providedUpper)).toBe(providedUpper);
	});
});
