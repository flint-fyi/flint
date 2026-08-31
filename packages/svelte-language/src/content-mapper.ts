#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

import {
	runContentMapper,
	type ContentMapperProject,
	type OpenProjectParams,
	type OptionDiagnostic,
	type TransformParams,
	type TransformResult,
} from "@flint.fyi/volar-language";

import {
	createSvelteTransform,
	transformSvelte as transform,
	type SvelteTransformOptions,
} from "./volarLanguagePlugin.ts";

export async function openSvelteProject(
	params: OpenProjectParams,
): Promise<ContentMapperProject> {
	const projectDirectory = params.configFileName
		? path.dirname(path.resolve(params.configFileName))
		: process.cwd();
	const configFile = findConfig(projectDirectory);
	const configSource = configFile
		? await fs.promises.readFile(configFile, "utf8")
		: "";
	let transformOptions: SvelteTransformOptions = {};
	if (configFile) {
		const imported = (await import(
			`${url.pathToFileURL(configFile).href}?flint=${crypto.createHash("sha256").update(configSource).digest("hex")}`
		)) as { default?: { compilerOptions?: SvelteTransformOptions } };
		transformOptions = imported.default?.compilerOptions ?? {};
	}
	const optionDiagnostics = validateOptions(params.options);
	return {
		configIdentity: crypto
			.createHash("sha256")
			.update(
				JSON.stringify({
					compilerOptions: params.compilerOptions,
					configFile,
					configSource,
					options: params.options,
				}),
			)
			.digest("hex"),
		transform: createSvelteTransform(transformOptions),
		validateOptions: () => optionDiagnostics,
		watchedFiles: configFile ? [path.resolve(configFile)] : [],
	};
}

export function transformSvelte(params: TransformParams): TransformResult {
	return transform(params);
}

function findConfig(start: string): string | undefined {
	let directory = path.resolve(start);
	while (true) {
		for (const name of [
			"svelte.config.js",
			"svelte.config.mjs",
			"svelte.config.cjs",
		]) {
			const candidate = path.join(directory, name);
			if (fs.existsSync(candidate)) {
				return candidate;
			}
		}
		const parent = path.dirname(directory);
		if (parent === directory) {
			return undefined;
		}
		directory = parent;
	}
}

function validateOptions(options: unknown): OptionDiagnostic[] {
	if (options == null) {
		return [];
	}
	if (typeof options !== "object" || Array.isArray(options)) {
		return [
			{
				messageText: "Svelte content mapper options must be an object.",
				path: [],
			},
		];
	}
	return Object.keys(options).map((key) => ({
		messageText: `Unknown Svelte content mapper option ${JSON.stringify(key)}.`,
		path: [key],
	}));
}

if (
	process.argv[1] &&
	path.resolve(process.argv[1]) === url.fileURLToPath(import.meta.url)
) {
	await runContentMapper({
		diagnosticSource: "svelte",
		openProject: openSvelteProject,
	});
}
