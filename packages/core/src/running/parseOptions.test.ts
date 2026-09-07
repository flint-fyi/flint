import type { StandardSchemaV1 } from "@standard-schema/spec";
import { describe, expect, expectTypeOf, it } from "vitest";
import z from "zod/v4";

import { parseOptions } from "./parseOptions.ts";

const numberSchema: StandardSchemaV1<string | undefined, number> = {
	"~standard": {
		validate(value) {
			if (value === undefined) {
				return { value: 0 };
			}

			if (typeof value !== "string") {
				return {
					issues: [{ message: "Expected a string.", path: ["received"] }],
				};
			}

			return { value: Number(value) };
		},
		vendor: "test",
		version: 1,
	},
};

describe(parseOptions, () => {
	it("types exact optional inputs and outputs", () => {
		const schema = {
			defaulted: z.string().default("default"),
			optional: z.string().optional(),
		};

		interface ExpectedInput {
			defaulted?: string | undefined;
			optional?: string | undefined;
		}
		interface ExpectedOutput {
			defaulted: string;
			optional?: string | undefined;
		}

		expectTypeOf(parseOptions<typeof schema>)
			.parameter(1)
			.toEqualTypeOf<ExpectedInput>();
		const result = parseOptions(schema, {});
		expectTypeOf(result).toExtend<ExpectedOutput>();
		expectTypeOf<ExpectedOutput>().toExtend<typeof result>();
	});

	it("returns undefined without a schema", () => {
		// flint-disable-next-line ts/misleadingVoidExpressions
		const result = parseOptions(undefined, undefined); // eslint-disable-line @typescript-eslint/no-confusing-void-expression -- Verify the undefined return type and value.

		expectTypeOf(result).toEqualTypeOf<undefined>();
		expect(result).toBeUndefined();
	});

	it("validates and transforms options with a synchronous Standard Schema", () => {
		const result = parseOptions({ value: numberSchema }, { value: "123" });

		expectTypeOf(result).toExtend<{ value: number }>();
		expectTypeOf<{ value: number }>().toExtend<typeof result>();
		expect(result).toEqual({ value: 123 });
	});

	it("applies Standard Schema defaults", () => {
		expect(parseOptions({ value: numberSchema }, {})).toEqual({ value: 0 });
	});

	it("omits absent optional outputs", () => {
		expect(parseOptions({ value: z.string().optional() }, {})).toStrictEqual(
			{},
		);
	});

	it("applies defaults when options are undefined", () => {
		expect(
			parseOptions({ value: numberSchema }, undefined as never),
		).toStrictEqual({ value: 0 });
	});

	it("rejects unknown options", () => {
		expect(() =>
			parseOptions({ value: numberSchema }, { extra: true } as never),
		).toThrow(/extra/);
	});

	it("identifies the option that failed validation", () => {
		expect(() =>
			parseOptions({ value: numberSchema }, {
				value: 123,
			} as never),
		).toThrow(
			expect.objectContaining({
				issues: [
					expect.objectContaining({
						message: "Expected a string.",
						path: ["value", "received"],
					}),
				],
			}),
		);
	});

	it("preserves explicitly undefined optional outputs", () => {
		expect(
			parseOptions({ value: z.string().optional() }, { value: undefined }),
		).toStrictEqual({ value: undefined });
	});

	it.each([[null], [[]], ["value"], [123]])(
		"rejects non-object options: %j",
		(options) => {
			expect(() => parseOptions({}, options as never)).toThrow();
		},
	);

	it("preserves nested property and array-index locations in errors", () => {
		const schema: StandardSchemaV1<undefined> = {
			"~standard": {
				validate: () => ({
					issues: [
						{ message: "Invalid item.", path: [{ key: "items" }, { key: 0 }] },
					],
				}),
				vendor: "test",
				version: 1,
			},
		};
		expect(() => parseOptions({ value: schema }, {})).toThrow(
			expect.objectContaining({
				issues: [
					expect.objectContaining({
						message: "Invalid item.",
						path: ["value", "items", 0],
					}),
				],
			}),
		);
	});

	it("rejects Promise-returning validators", () => {
		const schema: StandardSchemaV1<undefined> = {
			"~standard": {
				validate: () => Promise.resolve({ value: undefined }),
				vendor: "test",
				version: 1,
			},
		};
		expect(() => parseOptions({ value: schema }, {})).toThrow(
			"Async rule-option schemas are not supported.",
		);
	});
});
