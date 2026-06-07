/* eslint-disable jsdoc/no-undefined-types -- false positive, doesn't pick up native TS type arguments */

/**
 * Ensure that an object of type {@linkcode Value}
 * has exactly the specified properties of {@linkcode Shape}.
 * This is useful for type parameters,
 * by allowing you to ensure that a generic type is not being widened with extra properties
 * while still allowing for the properties of the type to be inferred more specifically.
 * @example
 * ```ts
 * type ExactExample = ExactObject<{ a: number }, { a: number }>;
 */
/* eslint-enable jsdoc/no-undefined-types */
export type ExactObject<Value, Shape> = Record<
	Exclude<keyof Value, keyof Shape>,
	never
> &
	Value;
