import type { StandardSchemaV1 } from "@standard-schema/spec";
import { describe, expect, expectTypeOf, it } from "vitest";
import z from "zod/v4";

import type {
	InferredInputObject,
	InferredOutputObject,
} from "../types/shapes.ts";
import { parseOptions } from "./parseOptions.ts";

const asyncNumberSchema: StandardSchemaV1<string | undefined, number> = {
	"~standard": {
		validate(value) {
			if (value === undefined) {
				return Promise.resolve({ value: 0 });
			}

			if (typeof value !== "string") {
				return Promise.resolve({
					issues: [{ message: "Expected a string.", path: ["received"] }],
				});
			}

			return Promise.resolve({ value: Number(value) });
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

		expectTypeOf(schema).toExtend<Record<string, StandardSchemaV1>>();
		expectTypeOf<
			InferredInputObject<typeof schema>
		>().toExtend<ExpectedInput>();
		expectTypeOf<ExpectedInput>().toExtend<
			InferredInputObject<typeof schema>
		>();
		expectTypeOf<
			InferredOutputObject<typeof schema>
		>().toExtend<ExpectedOutput>();
		expectTypeOf<ExpectedOutput>().toExtend<
			InferredOutputObject<typeof schema>
		>();
	});

	it("returns undefined without a schema", async () => {
		const result = parseOptions(undefined, undefined);

		expectTypeOf(result).toEqualTypeOf<Promise<undefined>>();
		await expect(result).resolves.toBeUndefined();
	});

	it("validates and transforms options with an asynchronous Standard Schema", async () => {
		const result = await parseOptions(
			{ value: asyncNumberSchema },
			{ value: "123" },
		);

		expectTypeOf(result).toExtend<{ value: number }>();
		expectTypeOf<{ value: number }>().toExtend<typeof result>();
		expect(result).toEqual({ value: 123 });
	});

	it("applies Standard Schema defaults", async () => {
		await expect(
			parseOptions({ value: asyncNumberSchema }, {}),
		).resolves.toEqual({ value: 0 });
	});

	it("omits absent optional outputs", async () => {
		await expect(
			parseOptions({ value: z.string().optional() }, {}),
		).resolves.toEqual({});
	});

	it("prefixes validation issue paths and rejects unknown options", async () => {
		await expect(
			parseOptions({ value: asyncNumberSchema }, {
				extra: true,
				value: 123,
			} as never),
		).rejects.toThrow(
			JSON.stringify(
				[
					{ message: "Unrecognized option.", path: ["extra"] },
					{
						message: "Expected a string.",
						path: ["value", "received"],
					},
				],
				undefined,
				2,
			),
		);
	});
});
