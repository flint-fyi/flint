import { describe, expect, it } from "vitest";
import z from "zod";

import type { CacheStorage } from "../types/cache.ts";
import { cacheStorageSchema } from "./cacheSchema.ts";

describe("cacheStorageSchema decoding", () => {
	it("parses valid cache data", () => {
		const validCache = {
			configs: {
				"flint.config.ts": 1_234_567_890,
				"package.json": 1_234_567_890,
			},
			files: {
				"src/index.ts": {
					timestamp: 1_234_567_890,
				},
			},
		};

		const result = z.safeDecode(cacheStorageSchema, JSON.stringify(validCache));
		expect(result.success).toBe(true);
	});

	it("rejects cache missing configs", () => {
		const invalidCache = {
			files: {},
		};

		const result = z.safeDecode(
			cacheStorageSchema,
			JSON.stringify(invalidCache),
		);
		expect(result.success).toBe(false);
	});

	it("rejects cache missing files", () => {
		const invalidCache = {
			configs: {},
		};

		const result = z.safeDecode(
			cacheStorageSchema,
			JSON.stringify(invalidCache),
		);
		expect(result.success).toBe(false);
	});

	it("rejects cache with invalid timestamp type", () => {
		const invalidCache = {
			configs: {},
			files: {
				"src/index.ts": {
					timestamp: "not-a-number",
				},
			},
		};

		const result = z.safeDecode(
			cacheStorageSchema,
			JSON.stringify(invalidCache),
		);
		expect(result.success).toBe(false);
	});

	it("parses cache with optional file properties", () => {
		const validCache = {
			configs: { "package.json": 123 },
			files: {
				"src/index.ts": {
					dependencies: ["src/utils.ts"],
					diagnostics: [{ text: "Error" }],
					timestamp: 123,
				},
			},
		};

		const result = z.safeDecode(cacheStorageSchema, JSON.stringify(validCache));
		expect(result.success).toBe(true);
	});

	it("parses cache with full file data including reports", () => {
		const validCache = {
			configs: { "package.json": 123 },
			files: {
				"src/index.ts": {
					dependencies: ["src/utils.ts"],
					diagnostics: [{ code: "TS1234", text: "Error message" }],
					reports: [
						{
							about: { id: "test-rule" },
							message: {
								primary: "Test error",
								secondary: [],
								suggestions: [],
							},
							range: {
								begin: { column: 0, line: 0, raw: 0 },
								end: { column: 5, line: 0, raw: 5 },
							},
						},
					],
					timestamp: 123,
				},
			},
		};

		const result = z.safeDecode(cacheStorageSchema, JSON.stringify(validCache));
		expect(result.success).toBe(true);
	});

	it("parses cache with report containing optional fields", () => {
		const validCache = {
			configs: { "package.json": 123 },
			files: {
				"src/index.ts": {
					reports: [
						{
							about: { id: "test-rule", presets: ["recommended"] },
							data: { count: 5, enabled: true, name: "test" },
							dependencies: ["src/other.ts"],
							fix: [{ range: { begin: 0, end: 5 }, text: "fixed" }],
							message: {
								primary: "Test error",
								secondary: ["More info"],
								suggestions: ["Try this"],
							},
							range: {
								begin: { column: 0, line: 0, raw: 0 },
								end: { column: 5, line: 0, raw: 5 },
							},
							suggestions: [
								{
									id: "suggestion-1",
									range: { begin: 0, end: 5 },
									text: "fix",
								},
							],
						},
					],
					timestamp: 123,
				},
			},
		};

		const result = z.safeDecode(cacheStorageSchema, JSON.stringify(validCache));
		expect(result.success).toBe(true);
	});

	it("rejects report with invalid message structure", () => {
		const invalidCache = {
			configs: { "package.json": 123 },
			files: {
				"src/index.ts": {
					reports: [
						{
							about: { id: "test-rule" },
							message: {
								primary: "Test error",
								// missing secondary and suggestions
							},
							range: {
								begin: { column: 0, line: 0, raw: 0 },
								end: { column: 5, line: 0, raw: 5 },
							},
						},
					],
					timestamp: 123,
				},
			},
		};

		const result = z.safeDecode(
			cacheStorageSchema,
			JSON.stringify(invalidCache),
		);
		expect(result.success).toBe(false);
	});

	it("rejects null input", () => {
		const result = z.safeDecode(cacheStorageSchema, JSON.stringify(null));
		expect(result.success).toBe(false);
	});

	it("rejects undefined input", () => {
		const result = z.safeDecode(cacheStorageSchema, JSON.stringify(undefined));
		expect(result.success).toBe(false);
	});

	it("rejects config with non-number timestamp", () => {
		const invalidCache = {
			configs: { "package.json": "not-a-number" },
			files: {},
		};

		const result = z.safeDecode(
			cacheStorageSchema,
			JSON.stringify(invalidCache),
		);
		expect(result.success).toBe(false);
	});

	it("rejects report range missing raw field", () => {
		const invalidCache = {
			configs: { "package.json": 123 },
			files: {
				"src/index.ts": {
					reports: [
						{
							about: { id: "test-rule" },
							message: {
								primary: "Error",
								secondary: [],
								suggestions: [],
							},
							range: {
								begin: { column: 0, line: 0 },
								end: { column: 5, line: 0 },
							},
						},
					],
					timestamp: 123,
				},
			},
		};

		const result = z.safeDecode(
			cacheStorageSchema,
			JSON.stringify(invalidCache),
		);
		expect(result.success).toBe(false);
	});

	it("rejects data with non-primitive values", () => {
		const invalidCache = {
			configs: { "package.json": 123 },
			files: {
				"src/index.ts": {
					reports: [
						{
							about: { id: "test-rule" },
							data: { nested: { object: true } },
							message: {
								primary: "Error",
								secondary: [],
								suggestions: [],
							},
							range: {
								begin: { column: 0, line: 0, raw: 0 },
								end: { column: 5, line: 0, raw: 5 },
							},
						},
					],
					timestamp: 123,
				},
			},
		};

		const result = z.safeDecode(
			cacheStorageSchema,
			JSON.stringify(invalidCache),
		);
		expect(result.success).toBe(false);
	});
});

describe("cacheStorageSchema", () => {
	it("encodes valid cache data to JSON string", () => {
		const validCache = {
			configs: {
				"flint.config.ts": 1_234_567_890,
				"package.json": 1_234_567_890,
			},
			files: {
				"src/index.ts": {
					timestamp: 1_234_567_890,
				},
			},
		};

		const encoded = z.encode(cacheStorageSchema, validCache);
		expect(typeof encoded).toBe("string");
		expect(JSON.parse(encoded)).toEqual(validCache);
	});

	it("decodes valid JSON string to cache data", () => {
		const validCache = {
			configs: { "package.json": 123 },
			files: {
				"src/index.ts": {
					timestamp: 123,
				},
			},
		};
		const json = JSON.stringify(validCache);

		const decoded = z.decode(cacheStorageSchema, json);
		expect(decoded).toEqual(validCache);
	});

	it("fails to encode invalid cache data", () => {
		const invalidCache = {
			configs: "invalid",
			files: {},
		};

		const result = z.safeEncode(
			cacheStorageSchema,
			invalidCache as unknown as z.output<typeof cacheStorageSchema>,
		);
		expect(result.success).toBe(false);
	});

	it("fails to decode invalid JSON string", () => {
		const invalidJson = "{ invalid json }";

		const result = z.safeDecode(
			cacheStorageSchema,
			JSON.stringify(invalidJson),
		);
		expect(result.success).toBe(false);
	});

	it("fails to decode valid JSON with invalid schema", () => {
		const validJsonInvalidSchema = JSON.stringify({
			configs: "not-a-record",
			files: {},
		});

		const result = z.safeDecode(
			cacheStorageSchema,
			JSON.stringify(validJsonInvalidSchema),
		);
		expect(result.success).toBe(false);
	});

	it("roundtrips cache data correctly", () => {
		const original = {
			configs: {
				"flint.config.ts": 1_234_567_890,
				"package.json": 1_234_567_890,
			},
			files: {
				"src/index.ts": {
					dependencies: ["src/utils.ts"],
					reports: [
						{
							about: { id: "test-rule", presets: ["recommended"] },
							message: {
								primary: "Test error",
								secondary: ["More info"],
								suggestions: [],
							},
							range: {
								begin: { column: 0, line: 0, raw: 0 },
								end: { column: 5, line: 0, raw: 5 },
							},
						},
					],
					timestamp: 1_234_567_890,
				},
			},
		};

		const encoded = z.encode(cacheStorageSchema, original);
		const decoded = z.decode(cacheStorageSchema, encoded);

		expect(decoded).toEqual(original);
	});
});

describe("toSerializableCacheStorage encoding", () => {
	it("passes through cache with only SuggestionForFile suggestions", () => {
		const cache: CacheStorage = {
			configs: { "package.json": 123 },
			files: {
				"src/index.ts": {
					reports: [
						{
							about: { id: "test-rule" },
							message: {
								primary: "Error",
								secondary: [],
								suggestions: [],
							},
							range: {
								begin: { column: 0, line: 0, raw: 0 },
								end: { column: 5, line: 0, raw: 5 },
							},
							suggestions: [
								{ id: "fix-1", range: { begin: 0, end: 5 }, text: "fixed" },
							],
						},
					],
					timestamp: 123,
				},
			},
		};

		const result = z.decode(
			cacheStorageSchema,
			z.encode(cacheStorageSchema, cache),
		);

		expect(result.files["src/index.ts"]?.reports?.[0]?.suggestions).toEqual([
			{ id: "fix-1", range: { begin: 0, end: 5 }, text: "fixed" },
		]);
	});

	it("filters out SuggestionForFiles (with functions)", () => {
		const cache: CacheStorage = {
			configs: { "package.json": 123 },
			files: {
				"src/index.ts": {
					reports: [
						{
							about: { id: "test-rule" },
							message: {
								primary: "Error",
								secondary: [],
								suggestions: [],
							},
							range: {
								begin: { column: 0, line: 0, raw: 0 },
								end: { column: 5, line: 0, raw: 5 },
							},
							suggestions: [
								// SuggestionForFile - should be kept
								{ id: "fix-1", range: { begin: 0, end: 5 }, text: "fixed" },
								// SuggestionForFiles - should be filtered out
								{
									files: {
										"other.ts": () => [
											{ range: { begin: 0, end: 1 }, text: "x" },
										],
									},
									id: "multi-fix",
								},
							],
						},
					],
					timestamp: 123,
				},
			},
		};

		const result = z.decode(
			cacheStorageSchema,
			z.encode(cacheStorageSchema, cache),
		);

		// Only the SuggestionForFile should remain
		expect(result.files["src/index.ts"]?.reports?.[0]?.suggestions).toEqual([
			{ id: "fix-1", range: { begin: 0, end: 5 }, text: "fixed" },
		]);
	});

	it("handles cache with no suggestions", () => {
		const cache: CacheStorage = {
			configs: { "package.json": 123 },
			files: {
				"src/index.ts": {
					reports: [
						{
							about: { id: "test-rule" },
							message: {
								primary: "Error",
								secondary: [],
								suggestions: [],
							},
							range: {
								begin: { column: 0, line: 0, raw: 0 },
								end: { column: 5, line: 0, raw: 5 },
							},
						},
					],
					timestamp: 123,
				},
			},
		};

		const result = z.decode(
			cacheStorageSchema,
			z.encode(cacheStorageSchema, cache),
		);

		expect(
			result.files["src/index.ts"]?.reports?.[0]?.suggestions,
		).toBeUndefined();
	});

	it("handles cache with no reports", () => {
		const cache: CacheStorage = {
			configs: { "package.json": 123 },
			files: {
				"src/index.ts": {
					timestamp: 123,
				},
			},
		};

		const result = z.decode(
			cacheStorageSchema,
			z.encode(cacheStorageSchema, cache),
		);

		expect(result.files["src/index.ts"]?.reports).toBeUndefined();
	});

	it("produces output that parses against the codec", () => {
		const cache: CacheStorage = {
			configs: { "package.json": 123 },
			files: {
				"src/index.ts": {
					reports: [
						{
							about: { id: "test-rule" },
							message: {
								primary: "Error",
								secondary: [],
								suggestions: [],
							},
							range: {
								begin: { column: 0, line: 0, raw: 0 },
								end: { column: 5, line: 0, raw: 5 },
							},
							suggestions: [
								{ id: "fix-1", range: { begin: 0, end: 5 }, text: "fixed" },
								// This would fail validation if not filtered
								{
									files: { "other.ts": () => [] },
									id: "multi-fix",
								},
							],
						},
					],
					timestamp: 123,
				},
			},
		};

		const serializable = z.decode(
			cacheStorageSchema,
			z.encode(cacheStorageSchema, cache),
		);
		const encoded = z.safeEncode(cacheStorageSchema, serializable);

		expect(encoded.success).toBe(true);
	});
});
