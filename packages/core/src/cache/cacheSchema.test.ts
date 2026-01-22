import { describe, expect, it } from "vitest";

import { cacheStorageSchema } from "./cacheSchema.ts";

describe("cacheStorageSchema", () => {
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

		const result = cacheStorageSchema.safeParse(validCache);
		expect(result.success).toBe(true);
	});

	it("rejects cache missing configs", () => {
		const invalidCache = {
			files: {},
		};

		const result = cacheStorageSchema.safeParse(invalidCache);
		expect(result.success).toBe(false);
	});

	it("rejects cache missing files", () => {
		const invalidCache = {
			configs: {},
		};

		const result = cacheStorageSchema.safeParse(invalidCache);
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

		const result = cacheStorageSchema.safeParse(invalidCache);
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

		const result = cacheStorageSchema.safeParse(validCache);
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

		const result = cacheStorageSchema.safeParse(validCache);
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

		const result = cacheStorageSchema.safeParse(validCache);
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

		const result = cacheStorageSchema.safeParse(invalidCache);
		expect(result.success).toBe(false);
	});

	it("rejects null input", () => {
		const result = cacheStorageSchema.safeParse(null);
		expect(result.success).toBe(false);
	});

	it("rejects undefined input", () => {
		const result = cacheStorageSchema.safeParse(undefined);
		expect(result.success).toBe(false);
	});

	it("rejects config with non-number timestamp", () => {
		const invalidCache = {
			configs: { "package.json": "not-a-number" },
			files: {},
		};

		const result = cacheStorageSchema.safeParse(invalidCache);
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

		const result = cacheStorageSchema.safeParse(invalidCache);
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

		const result = cacheStorageSchema.safeParse(invalidCache);
		expect(result.success).toBe(false);
	});
});
