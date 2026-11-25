import { describe, expect, it } from "vitest";
import z from "zod/v4";

import type { CacheStorage } from "../types/cache.ts";
import { cacheStorageSchema } from "./cacheFormat.ts";
import { cacheStorageSchemaObject } from "./cacheSchema.ts";

describe("cacheStorageSchema decoding", () => {
	it("rejects an explicitly false global invalidation flag", () => {
		const result = cacheStorageSchemaObject.safeParse({
			configs: {},
			files: {
				"src/index.ts": { isGlobalDependency: false, timestamp: 123 },
			},
		});

		expect(result.success).toBe(false);
	});

	it("parses valid cache data", () => {
		const validCache: CacheStorage = {
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

		const result = z.safeDecode(
			cacheStorageSchema,
			cacheStorageSchema.encode(validCache),
		);

		expect(result.success).toBe(true);
	});

	it("rejects cache missing configs", () => {
		const invalidCache = {
			files: [],
			groups: [],
			paths: [],
		};

		const result = z.safeDecode(
			cacheStorageSchema,
			JSON.stringify(invalidCache),
		);

		expect(result.success).toBe(false);
	});

	it("rejects cache missing files", () => {
		const invalidCache = {
			configs: [],
			groups: [],
			paths: [],
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

		const result = cacheStorageSchemaObject.safeParse(invalidCache);

		expect(result.success).toBe(false);
	});

	it("parses cache with optional file properties", () => {
		const validCache: CacheStorage = {
			configs: { "package.json": 123 },
			files: {
				"src/index.ts": {
					dependencies: ["src/utils.ts"],
					languageReports: [{ text: "Error" }],
					timestamp: 123,
				},
			},
		};

		const result = z.safeDecode(
			cacheStorageSchema,
			cacheStorageSchema.encode(validCache),
		);

		expect(result.success).toBe(true);
	});

	it("parses cache with full file data including reports", () => {
		const validCache: CacheStorage = {
			configs: { "package.json": 123 },
			files: {
				"src/index.ts": {
					dependencies: ["src/utils.ts"],
					languageReports: [
						{ code: "TS1234", source: "typescript", text: "Error message" },
					],
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

		const result = z.safeDecode(
			cacheStorageSchema,
			cacheStorageSchema.encode(validCache),
		);

		expect(result.success).toBe(true);
		expect(result).toEqual(
			expect.objectContaining({
				data: expect.objectContaining({
					files: {
						"src/index.ts": expect.objectContaining({
							languageReports: [
								expect.objectContaining({ source: "typescript" }),
							],
						}),
					},
				}),
			}),
		);
	});

	it("parses cache with report containing optional fields", () => {
		const validCache: CacheStorage = {
			configs: { "package.json": 123 },
			files: {
				"src/index.ts": {
					reports: [
						{
							about: { id: "test-rule" },
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

		const result = z.safeDecode(
			cacheStorageSchema,
			cacheStorageSchema.encode(validCache),
		);

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

		const result = cacheStorageSchemaObject.safeParse(invalidCache);

		expect(result.success).toBe(false);
	});

	it("rejects null input", () => {
		const result = z.safeDecode(cacheStorageSchema, JSON.stringify(null));

		expect(result.success).toBe(false);
	});

	it("rejects undefined input", () => {
		const result = z.safeDecode(cacheStorageSchema, "undefined");

		expect(result.success).toBe(false);
	});

	it("rejects config with non-number timestamp", () => {
		const invalidCache = {
			configs: { "package.json": "not-a-number" },
			files: {},
		};

		const result = cacheStorageSchemaObject.safeParse(invalidCache);

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

		const result = cacheStorageSchemaObject.safeParse(invalidCache);

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

		const result = cacheStorageSchemaObject.safeParse(invalidCache);

		expect(result.success).toBe(false);
	});
});

describe("cacheStorageSchema", () => {
	it("stores paths once and preserves shared dependency arrays when decoding", () => {
		const cache: CacheStorage = {
			configs: {},
			files: {
				"a.ts": {
					dependencies: ["/shared/a.ts", "/shared/b.ts"],
					timestamp: 1,
				},
				"b.ts": {
					dependencies: ["/shared/a.ts", "/shared/b.ts"],
					timestamp: 2,
				},
				"c.ts": { dependencies: ["/shared/a.ts"], timestamp: 3 },
				"d.ts": {
					dependencies: ["/shared/b.ts", "/shared/a.ts"],
					timestamp: 4,
				},
				"emoji-😀.ts": {
					dependencies: ["/shared/config-😁.json"],
					timestamp: 6,
				},
				"empty.ts": { dependencies: [], timestamp: 5 },
				"missing.ts": {
					dependencies: ["/shared/a.ts"],
					missingDependencies: ["/shared/a.ts", "/shared/missing.ts"],
					timestamp: 7,
				},
			},
		};
		const encoded = cacheStorageSchema.encode(cache);
		const decoded = cacheStorageSchema.decode(encoded);
		expect(decoded).toEqual(cache);
		expect(encoded.split('"/shared/a.ts"')).toHaveLength(2);
		expect(decoded.files["a.ts"]?.dependencies).toBe(
			decoded.files["b.ts"]?.dependencies,
		);
		expect(decoded.files["a.ts"]?.dependencies).not.toBe(
			decoded.files["c.ts"]?.dependencies,
		);
	});

	it.each([
		{ version: undefined },
		{ version: 2 },
		{ paths: [[1, "a.ts"]] },
		{ groups: [[1, []]] },
		{ groups: [[0, [1]]] },
		{ files: [[0, 123, -1]] },
		{ files: [[1, 123, -1, -1]] },
		{ files: [[0, 123, 1, -1]] },
		{ files: [[0, 123, -1, 1]] },
	])(
		"rejects invalid versions, table references and prefixes: %j",
		(invalid) => {
			const stored = {
				configs: [],
				files: [[0, 123, -1, -1]],
				groups: [[0, []]],
				paths: [[0, "a.ts"]],
				version: 1,
			};
			expect(cacheStorageSchema.decode(JSON.stringify(stored))).toEqual({
				configs: {},
				files: { "a.ts": { timestamp: 123 } },
			});
			expect(
				cacheStorageSchema.safeDecode(JSON.stringify({ ...stored, ...invalid }))
					.success,
			).toBe(false);
		},
	);

	it("rejects non-path dependency values", () => {
		expect(
			cacheStorageSchema.safeEncode({
				configs: {},
				files: { "a.ts": { dependencies: [123], timestamp: 1 } },
			} as unknown as CacheStorage).success,
		).toBe(false);
	});

	it("encodes valid cache data to JSON string", () => {
		const validCache: CacheStorage = {
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
		expect(cacheStorageSchema.decode(encoded)).toEqual(validCache);
	});

	it("decodes valid JSON string to cache data", () => {
		const validCache: CacheStorage = {
			configs: { "package.json": 123 },
			files: {
				"src/index.ts": {
					timestamp: 123,
				},
			},
		};
		const json = cacheStorageSchema.encode(validCache);

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
		const original: CacheStorage = {
			configs: {
				"flint.config.ts": 1_234_567_890,
				"package.json": 1_234_567_890,
			},
			files: {
				"src/index.ts": {
					dependencies: ["src/utils.ts"],
					isGlobalDependency: true,
					languageReports: [
						{ code: "TS1234", source: "typescript", text: "Error message" },
					],
					reports: [
						{
							about: { id: "test-rule" },
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
								{
									files: {
										"other.ts": [{ range: { begin: 0, end: 1 }, text: "x" }],
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

		expect(result.files["src/index.ts"]?.reports?.[0]?.suggestions).toEqual([
			{ id: "fix-1", range: { begin: 0, end: 5 }, text: "fixed" },
			{
				files: {
					"other.ts": [{ range: { begin: 0, end: 1 }, text: "x" }],
				},
				id: "multi-fix",
			},
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
									files: { "other.ts": [] },
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
