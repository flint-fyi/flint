#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import url from "node:url";

import {
	runContentMapper,
	type ContentMapperProject,
	type OpenProjectParams,
	type OptionDiagnostic,
	type TransformParams,
	type TransformResult,
} from "@flint.fyi/content-mapper";

import {
	createSvelteTransform,
	transformSvelte as transform,
	type SvelteTransformOptions,
} from "./contentMapperPlugin.ts";

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
		// The `?flint=` query below only busts Node's ESM module cache. CommonJS
		// configs (`.cjs`, or `.js` without `"type": "module"`) are cached by file
		// path in the require cache, so evict them explicitly to pick up edits.
		const require = createRequire(import.meta.url);
		Reflect.deleteProperty(require.cache, require.resolve(configFile));
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

/**
 * Starts the Svelte content-mapper JSON-RPC server over stdio.
 *
 * Thin wrapper packages (`@flint.fyi/svelte`) re-export this module and are
 * themselves the exec'd entry, so the `argv[1] === import.meta.url` guard below
 * can never match for them. They call this directly instead.
 */
export async function runSvelteContentMapper(): Promise<void> {
	await runContentMapper({
		diagnosticSource: "svelte",
		openProject: openSvelteProject,
	});
}

if (
	process.argv[1] &&
	path.resolve(process.argv[1]) === url.fileURLToPath(import.meta.url)
) {
	await runSvelteContentMapper();
}
