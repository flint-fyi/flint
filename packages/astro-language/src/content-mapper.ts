import fs from "node:fs";
import path from "node:path";

import { parse } from "@astrojs/compiler/sync";
import type { ElementNode, ParentNode } from "@astrojs/compiler/types";
import { astro2tsx } from "@astrojs/ts-plugin/dist/astro2tsx.js";

import {
	createMappedOutput,
	runContentMapper,
	SpanMappingKind,
	type ContentMapperProject,
	type TransformParams,
	type TransformResult,
} from "@flint.fyi/content-mapper";
import type { SourceFileWithLineMap } from "@flint.fyi/core";

import { getAstroPointOffset } from "./getAstroPointOffset.ts";
import { normalizeAstroMappings } from "./normalizeAstroMappings.ts";

// The type files Astro's language server adds to every program that contains
// `.astro` files: the `Astro` global and the JSX namespace its elements use.
// https://github.com/withastro/astro/blob/c0f33eda8adf6f8f2588688f6205b76a96a42466/packages/language-tools/language-server/src/core/index.ts#L31-L81
const ambientTypeFileNames = ["env.d.ts", "astro-jsx.d.ts"];
const ambientTypeFilesByDirectory = new Map<string, string[]>();

export function openAstroProject(): ContentMapperProject {
	return { transform: transformAstro };
}

export function transformAstro({
	content,
	fileName,
}: TransformParams): TransformResult {
	const { diagnostics: transformDiagnostics, virtualFile: serviceScript } =
		astro2tsx(content, fileName);
	// The imports go after the generated TSX so its mappings keep their offsets.
	const text =
		serviceScript.snapshot.getText(0, serviceScript.snapshot.getLength()) +
		getAmbientTypeImports(fileName);
	const { ast, diagnostics: parseDiagnostics } = parse(content, {
		position: true,
	});
	const diagnostics = [
		...new Map(
			[...transformDiagnostics, ...parseDiagnostics].map((diagnostic) => [
				[
					diagnostic.code,
					diagnostic.location.column,
					diagnostic.location.length,
					diagnostic.location.line,
					diagnostic.text,
				].join(":"),
				diagnostic,
			]),
		).values(),
	];
	// Only genuine errors mean the transformed output can't be trusted enough to
	// map back to. Warnings and hints must still map, or they would silently
	// suppress all linting and type-checking for the file.
	const hasBlockingError = diagnostics.some(
		// `DiagnosticSeverity.Error` from @astrojs/compiler.
		(diagnostic) => diagnostic.severity === 1,
	);
	const canonical = hasBlockingError
		? { extension: ".tsx", mappings: [], text }
		: createMappedOutput({
				content,
				extension: ".tsx",
				mappings: normalizeAstroMappings(serviceScript.mappings, text, content),
				text,
			});
	const source: SourceFileWithLineMap = { text: content };
	return {
		...canonical,
		diagnostics: diagnostics.map((diagnostic) => ({
			code: diagnostic.code,
			length: diagnostic.location.length,
			messageText: `${diagnostic.text}${"hint" in diagnostic && diagnostic.hint ? ` (${diagnostic.hint})` : ""}`,
			start: getAstroPointOffset(source, diagnostic.location),
		})),
		supplemental: collectScripts(ast, source).map(({ end, start }) => ({
			extension: ".ts",
			mappings: [
				[0, end - start, start, end - start, SpanMappingKind.Verbatim],
			],
			text: content.slice(start, end),
		})),
	};
}

/**
 * Walks up from a component's directory to the `astro` package installed for
 * it, the same way `@astrojs/ts-plugin` does. Node's own resolution is not
 * used because it also searches `NODE_PATH`, which package manager shims set
 * to directories unrelated to the linted project.
 */
function collectScripts(
	node: ParentNode,
	source: SourceFileWithLineMap,
): { end: number; start: number }[] {
	const scripts: { end: number; start: number }[] = [];
	for (const child of node.children) {
		if (
			child.type === "element" &&
			child.name === "script" &&
			isJavaScriptScript(child)
		) {
			for (const content of child.children) {
				if (content.position?.end) {
					scripts.push({
						end: getAstroPointOffset(source, content.position.end),
						start: getAstroPointOffset(source, content.position.start),
					});
				}
			}
		}
		if ("children" in child) {
			scripts.push(...collectScripts(child, source));
		}
	}
	return scripts;
}

function findAstroPackageDirectory(directory: string): string | undefined {
	let current = directory;
	while (true) {
		const candidate = path.join(current, "node_modules", "astro");
		if (fs.existsSync(path.join(candidate, "package.json"))) {
			return candidate;
		}
		const parent = path.dirname(current);
		if (parent === current) {
			return undefined;
		}
		current = parent;
	}
}

/**
 * Side-effect imports of Astro's ambient type files, from the `astro` package
 * installed for the component's own directory. A project without `astro`
 * installed gets no imports rather than a module-not-found error on every
 * component.
 */
function getAmbientTypeImports(fileName: string): string {
	const directory = path.dirname(fileName);
	let ambientTypeFiles = ambientTypeFilesByDirectory.get(directory);
	if (!ambientTypeFiles) {
		const astroDirectory = findAstroPackageDirectory(directory);
		ambientTypeFiles = astroDirectory
			? ambientTypeFileNames
					.map((ambientTypeFileName) =>
						path.join(astroDirectory, ambientTypeFileName),
					)
					.filter((ambientTypeFile) => fs.existsSync(ambientTypeFile))
			: [];
		ambientTypeFilesByDirectory.set(directory, ambientTypeFiles);
	}
	return ambientTypeFiles
		.map((ambientTypeFile) => `\nimport ${JSON.stringify(ambientTypeFile)};`)
		.join("");
}

function isJavaScriptScript(node: ElementNode): boolean {
	const type = node.attributes.find((attribute) => attribute.name === "type");
	if (!type) {
		return true;
	}
	if (type.kind !== "quoted") {
		return type.kind === "empty";
	}
	return /^(?:(?:application|text)\/(?:x-)?(?:ecma|java|type)script|module)?$/i.test(
		type.value.trim(),
	);
}

/** Starts the Astro content-mapper JSON-RPC server over stdio. */
export async function runAstroContentMapper(): Promise<void> {
	await runContentMapper({
		diagnosticSource: "astro",
		openProject: openAstroProject,
	});
}

// Thin wrapper packages (`@flint.fyi/astro` re-exporting `@flint.fyi/astro-language`)
// import this module as their own exec'd entry, so only start a server when
// this module itself is the entry.
if (import.meta.main) {
	// This is the process entry point when TypeScript spawns the mapper, so
	// nothing imports it and there is nothing for the await to delay.
	// flint-disable-next-line ts/topLevelAwaits
	await runAstroContentMapper();
}
