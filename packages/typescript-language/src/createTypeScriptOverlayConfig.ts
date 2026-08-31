import { createHash } from "node:crypto";
import path from "node:path";

import type { TypeScriptContentMapperRegistration } from "./contentMappers.ts";

export interface TypeScriptOverlayConfig {
	filePath: string;
	sourceText: string;
}

export function createTypeScriptOverlayConfig(
	currentDirectory: string,
	authoredConfigFilePath: string,
	authoredConfig: unknown,
	registrations: TypeScriptContentMapperRegistration[],
): TypeScriptOverlayConfig {
	if (
		typeof authoredConfig !== "object" ||
		authoredConfig === null ||
		Array.isArray(authoredConfig)
	) {
		throw new Error("TypeScript config must be an object.");
	}
	const rawConfig = authoredConfig as { references?: unknown };
	const configDirectory = path.dirname(authoredConfigFilePath);
	if (
		rawConfig.references !== undefined &&
		!Array.isArray(rawConfig.references)
	) {
		throw new Error("TypeScript config references must be an array.");
	}
	const references = rawConfig.references?.map((reference: unknown) => {
		if (
			typeof reference !== "object" ||
			reference === null ||
			!("path" in reference) ||
			typeof reference.path !== "string"
		) {
			throw new Error(
				"TypeScript config references entries must contain a string path.",
			);
		}
		return {
			...reference,
			path: path.resolve(configDirectory, reference.path),
		};
	});
	const hash = createHash("sha256")
		.update(authoredConfigFilePath)
		.digest("hex")
		.slice(0, 16);

	return {
		filePath: path.join(
			currentDirectory,
			"node_modules/.cache/flint/typescript-overlays",
			`${hash}.json`,
		),
		sourceText: JSON.stringify({
			contentMappers: registrations.map(
				({ extensions, options, packageName }) => ({
					extensions,
					...(options && { options }),
					package: packageName,
				}),
			),
			extends: authoredConfigFilePath,
			...(references && { references }),
		}),
	};
}
