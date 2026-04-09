import type * as z from "zod/v4/core";

/**
 * Any object containing Zod schemas that are optional.
 * In other words, allows providing an empty object {} value.
 */
export type AnyOptionalSchema = Record<string, z.$ZodDefault | z.$ZodOptional>;

export type OptionalObjectSchema<OptionsSchema extends AnyOptionalSchema> =
	z.$ZodObject<OptionsSchema, z.$strict> &
		z.$ZodType<
			Record<string, unknown>,
			Record<string, unknown>,
			z.$ZodObjectInternals<OptionsSchema, z.$strict>
		>;

/**
 * Given an object containing Zod schemas, produces the equivalent runtime type.
 * @example
 * ```type
 * InferredInputObject<{ value: z.ZodDefault<z.ZodNumber> }>
 * ```
 * is the same as:
 * ```type
 * { value?: number }
 * ```
 */
export type InferredInputObject<
	OptionsSchema extends AnyOptionalSchema | undefined,
> = OptionsSchema extends AnyOptionalSchema
	? z.input<OptionalObjectSchema<OptionsSchema>>
	: undefined;

/**
 * Given an object containing Zod schemas, produces the equivalent runtime type.
 * @example
 * ```type
 * InferredOutputObject<{ value: z.ZodOptional<z.ZodNumber> }>
 * ```
 * is the same as:
 * ```type
 * { value: number }
 * ```
 */
export type InferredOutputObject<
	OptionsSchema extends AnyOptionalSchema | undefined,
> = OptionsSchema extends AnyOptionalSchema
	? z.output<OptionalObjectSchema<OptionsSchema>>
	: undefined;
