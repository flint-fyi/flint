import { createHash } from "node:crypto";

import path from "pathe";

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
		// The overlay is a virtual file that is never written to disk, so this
		// path only has to be somewhere TypeScript will read and watch it. It
		// deliberately avoids `node_modules/.cache`: TypeScript ignores change
		// notifications for any path under a dot-directory inside node_modules,
		// which would leave a project on a stale overlay after it changes.
		filePath: path.join(
			currentDirectory,
			"node_modules/flint-typescript-overlays",
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
			...(rootFilePaths && { files: rootFilePaths }),
			...(references && { references }),
		}),
	};
}
