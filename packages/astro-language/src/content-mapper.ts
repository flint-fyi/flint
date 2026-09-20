import { parse } from "@astrojs/compiler/sync";
import type { ElementNode, ParentNode } from "@astrojs/compiler/types";
import { astro2tsx } from "@astrojs/ts-plugin/dist/astro2tsx.js";

import {
	createContentMapperTransform,
	runContentMapper,
	SpanMappingKind,
	type ContentMapperProject,
	type ContentMapperTransformSource,
	type TransformParams,
	type TransformResult,
} from "@flint.fyi/content-mapper";
import { getPositionOfColumnAndLine } from "@flint.fyi/core";

export function openAstroProject(): ContentMapperProject {
	return { transform: transformAstro };
}

export function transformAstro(params: TransformParams): TransformResult {
	const { diagnostics: transformDiagnostics, virtualFile: serviceScript } =
		astro2tsx(params.content, params.fileName);
	const text = serviceScript.snapshot.getText(
		0,
		serviceScript.snapshot.getLength(),
	);
	const { ast, diagnostics: parseDiagnostics } = parse(params.content, {
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
		: createContentMapperTransform({
				extension: ".tsx",
				mappings: normalizeAstroMappings(
					serviceScript.mappings,
					text,
					params.content,
				),
				text,
			})(params);
	return {
		...canonical,
		diagnostics: diagnostics.map((diagnostic) => {
			const start = getPositionOfColumnAndLine(
				{ text: params.content },
				{
					column: diagnostic.location.column - 1,
					line: diagnostic.location.line - 1,
				},
			);
			return {
				code: diagnostic.code,
				length: diagnostic.location.length,
				messageText: `${diagnostic.text}${"hint" in diagnostic && diagnostic.hint ? ` (${diagnostic.hint})` : ""}`,
				start,
			};
		}),
		supplemental: collectScripts(ast).map(({ end, start }) => ({
			extension: ".ts",
			mappings: [
				[0, end - start, start, end - start, SpanMappingKind.Verbatim],
			],
			text: params.content.slice(start, end),
		})),
	};
}

function collectScripts(node: ParentNode): { end: number; start: number }[] {
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
						end: content.position.end.offset,
						start: content.position.start.offset,
					});
				}
			}
		}
		if ("children" in child) {
			scripts.push(...collectScripts(child));
		}
	}
	return scripts;
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

function normalizeAstroMappings(
	mappings: ContentMapperTransformSource["mappings"],
	generatedText: string,
	originalText: string,
): ContentMapperTransformSource["mappings"] {
	const flattened: {
		data: ContentMapperTransformSource["mappings"][number]["data"];
		exact: boolean;
		generatedLength: number;
		generatedOffset: number;
		length: number;
		sourceOffset: number;
	}[] = [];
	for (const mapping of mappings) {
		for (const [index, generatedOffset] of mapping.generatedOffsets.entries()) {
			const length = mapping.lengths[index];
			const sourceOffset = mapping.sourceOffsets[index];
			if (length === undefined || sourceOffset === undefined) {
				throw new Error("Astro mapping arrays must have equal lengths");
			}
			const generatedLength = mapping.generatedLengths?.[index] ?? length;
			flattened.push({
				data: mapping.data,
				exact:
					generatedLength === length &&
					generatedText.slice(
						generatedOffset,
						generatedOffset + generatedLength,
					) === originalText.slice(sourceOffset, sourceOffset + length),
				generatedLength,
				generatedOffset,
				length,
				sourceOffset,
			});
		}
	}
	flattened.sort((left, right) => {
		return (
			Number(right.exact) - Number(left.exact) || right.length - left.length
		);
	});
	const normalized: typeof flattened = [];
	for (const mapping of flattened) {
		const overlaps = normalized.some((selected) => {
			return (
				(mapping.sourceOffset !== selected.sourceOffset ||
					mapping.length !== selected.length) &&
				mapping.sourceOffset < selected.sourceOffset + selected.length &&
				selected.sourceOffset < mapping.sourceOffset + mapping.length
			);
		});
		if (!overlaps) {
			normalized.push(mapping);
		}
	}
	return normalized.map((mapping) => ({
		data: mapping.data,
		...(mapping.generatedLength !== mapping.length && {
			generatedLengths: [mapping.generatedLength],
		}),
		generatedOffsets: [mapping.generatedOffset],
		lengths: [mapping.length],
		sourceOffsets: [mapping.sourceOffset],
	}));
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
