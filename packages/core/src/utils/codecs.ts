/**
 * https://zod.dev/codecs#useful-codecs
 */

import z from "zod/v4";

export const jsonCodec = <T extends z.core.$ZodType>(schema: T) =>
	z.codec(z.string(), schema, {
		decode: (jsonString, ctx) => {
			try {
				return JSON.parse(jsonString) as z.input<T>;
			} catch (error) {
				ctx.issues.push({
					code: "invalid_format",
					format: "json",
					input: jsonString,
					message: (error as SyntaxError).message,
				});
				return z.NEVER;
			}
		},
		encode: (value) => JSON.stringify(value),
	});
