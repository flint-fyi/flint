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
	if (schema === undefined) {
		return undefined as InferredOutputObject<OptionsSchema>;
	}

	const shape = Object.fromEntries(
		Object.entries(schema).map(([key, propertySchema]) => [
			key,
			new z.$ZodTransform({
				transform(value, context) {
					const result = propertySchema["~standard"].validate(value);
					if (result instanceof Promise) {
						throw new Error("Async rule-option schemas are not supported.");
					}
					if (!result.issues) {
						return result.value;
					}

					for (const issue of result.issues) {
						context.issues.push({
							code: "custom",
							input: value,
							message: issue.message,
							path: issue.path?.map((segment) =>
								typeof segment === "object" ? segment.key : segment,
							),
						});
					}
					return undefined;
				},
				type: "transform",
			}),
		]),
	);

	return z.parse(
		new z.$ZodPrefault({
			defaultValue: {},
			innerType: new z.$ZodObject({
				catchall: new z.$ZodNever({ type: "never" }),
				shape,
				type: "object",
			}),
			type: "prefault",
		}),
		options,
	) as InferredOutputObject<OptionsSchema>;
}
