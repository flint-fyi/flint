import path from "pathe";

import type { TypeScriptContentMapperRegistration } from "./contentMappers.ts";

export interface TypeScriptOverlayConfig {
	filePath: string;
	sourceText: string;
}

export function createTypeScriptOverlayConfig(
	authoredConfigFilePath: string,
	authoredConfig: unknown,
	registrations: TypeScriptContentMapperRegistration[],
	rootFilePaths?: string[],
): TypeScriptOverlayConfig {
	if (
		typeof authoredConfig !== "object" ||
		authoredConfig === null ||
		Array.isArray(authoredConfig)
	) {
		throw new Error("TypeScript config must be an object.");
	}
	const rawConfig = authoredConfig as { references?: unknown };
	if (
		rawConfig.references !== undefined &&
		!Array.isArray(rawConfig.references)
	) {
		throw new Error("TypeScript config references must be an array.");
	}
	const configDirectory = path.dirname(authoredConfigFilePath);
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
	return {
		// The overlay is a virtual file that is never written to disk. It sits
		// beside the authored config because TypeScript treats the config it
		// loads as the project's own: a composite project's default `rootDir` is
		// that config's directory, and content mappers look for their own
		// configs (such as `svelte.config.js`) starting from it.
		filePath: path.join(
			configDirectory,
			`${path.basename(authoredConfigFilePath, ".json")}.flint-overlay.json`,
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
			...(rootFilePaths && { files: rootFilePaths }),
			...(references && { references }),
		}),
	};
}
