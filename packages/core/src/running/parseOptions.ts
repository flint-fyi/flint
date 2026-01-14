import * as z from "zod/v4/core";

import type {
	AnyOptionalSchema,
	InferredInputObject,
	InferredOutputObject,
} from "../types/shapes.ts";

export function parseOptions<
	OptionsSchema extends AnyOptionalSchema | undefined,
>(
	schema: OptionsSchema,
	options: InferredInputObject<OptionsSchema>,
): InferredOutputObject<OptionsSchema> {
	return (
		schema !== undefined
			? z.parse(
					new z.$ZodPrefault({
						defaultValue: {},
						innerType: new z.$ZodObject({
							catchall: new z.$ZodNever({ type: "never" }),
							shape: schema,
							type: "object",
						}),
						type: "prefault",
					}),
					options,
				)
			: undefined
	) as InferredOutputObject<OptionsSchema>;
}
