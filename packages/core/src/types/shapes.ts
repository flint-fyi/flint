import type { StandardSchemaV1 } from "@standard-schema/spec";

/**
 * Any object containing Standard Schemas that are optional.
 * In other words, allows providing an empty object {} value.
 */
export type AnyOptionalSchema = Record<string, StandardSchemaV1>;

export type OptionalObjectSchema<
	OptionsSchema extends AnyOptionalSchema | undefined,
> = OptionsSchema & {
	[Key in keyof OptionsSchema]: undefined extends StandardSchemaV1.InferInput<
		OptionsSchema[Key] & StandardSchemaV1
	>
		? OptionsSchema[Key]
		: never;
};

/**
 * Given an object containing Standard Schemas, produces the equivalent input type.
 * @example
 * ```type
 * InferredInputObject<{ value: StandardSchemaV1<number | undefined> }>
 * ```
 * is the same as:
 * ```type
 * { value?: number | undefined }
 * ```
 */
export type InferredInputObject<
	OptionsSchema extends AnyOptionalSchema | undefined,
> = OptionsSchema extends AnyOptionalSchema
	? {
			[Key in keyof OptionsSchema]?: StandardSchemaV1.InferInput<
				OptionsSchema[Key]
			>;
		}
	: undefined;

/**
 * Given an object containing Standard Schemas, produces the equivalent output type.
 * @example
 * ```type
 * InferredOutputObject<{
 *   value: StandardSchemaV1<number | undefined, number>
 * }>
 * ```
 * is the same as:
 * ```type
 * { value: number }
 * ```
 */
export type InferredOutputObject<
	OptionsSchema extends AnyOptionalSchema | undefined,
> = OptionsSchema extends AnyOptionalSchema
	? {
			[Key in keyof OptionsSchema as undefined extends StandardSchemaV1.InferOutput<
				OptionsSchema[Key]
			>
				? Key
				: never]?: StandardSchemaV1.InferOutput<OptionsSchema[Key]>;
		} & {
			[Key in keyof OptionsSchema as undefined extends StandardSchemaV1.InferOutput<
				OptionsSchema[Key]
			>
				? never
				: Key]: StandardSchemaV1.InferOutput<OptionsSchema[Key]>;
		}
	: undefined;
