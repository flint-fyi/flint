/**
 * @see https://github.com/sindresorhus/type-fest/blob/main/source/simplify.d.ts
 */
export type Simplify<T> = {
	[K in keyof T]: T[K];
};

/**
 * The same visitors as T, but with optional `:exit` listeners added.
 */
export type WithExitKeys<T> = Simplify<
	T & {
		[K in keyof T & string as `${K}:exit`]?: T[K];
	}
>;
