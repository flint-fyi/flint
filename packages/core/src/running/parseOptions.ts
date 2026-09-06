import type { StandardSchemaV1 } from "@standard-schema/spec";

import type {
	AnyOptionalSchema,
	InferredInputObject,
	InferredOutputObject,
} from "../types/shapes.ts";

export async function parseOptions<
	OptionsSchema extends AnyOptionalSchema | undefined,
>(
	schema: OptionsSchema,
	options: InferredInputObject<OptionsSchema>,
): Promise<InferredOutputObject<OptionsSchema>> {
	if (schema === undefined) {
		return undefined as InferredOutputObject<OptionsSchema>;
	}

	let optionsObject: unknown = options;
	if (optionsObject === undefined) {
		optionsObject = {};
	}

	if (
		typeof optionsObject !== "object" ||
		optionsObject === null ||
		Array.isArray(optionsObject)
	) {
		throw new Error(
			JSON.stringify([{ message: "Expected an object." }], undefined, 2),
		);
	}

	const optionsRecord = optionsObject as Record<string, unknown>;
	const issues: StandardSchemaV1.Issue[] = Object.keys(optionsRecord)
		.filter((key) => !Object.hasOwn(schema, key))
		.map((key) => ({ message: "Unrecognized option.", path: [key] }));
	const output: Record<string, unknown> = {};

	for (const [key, propertySchema] of Object.entries(schema)) {
		const result = await propertySchema["~standard"].validate(
			optionsRecord[key],
		);

		if (result.issues) {
			issues.push(
				...result.issues.map((issue) => ({
					...issue,
					path: [key, ...(issue.path ?? [])],
				})),
			);
			continue;
		}

		if (result.value !== undefined || Object.hasOwn(optionsRecord, key)) {
			output[key] = result.value;
		}
	}

	if (issues.length) {
		throw new Error(JSON.stringify(issues, undefined, 2));
	}

	return output as InferredOutputObject<OptionsSchema>;
}
