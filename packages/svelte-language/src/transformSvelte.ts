import fs from "node:fs";
import path from "node:path";
import url from "node:url";

import { decode } from "@jridgewell/sourcemap-codec";
import { svelte2tsx } from "svelte2tsx";

import {
	createMappedOutput,
	SPAN_MAPPING_FEATURE_ALL,
	SpanMappingFeature,
	SpanMappingKind,
	TRANSFORM_FAILURE_CODE,
	type MapperDiagnostic,
	type SpanMapping,
	type TransformParams,
	type TransformResult,
} from "@flint.fyi/content-mapper";
import {
	getPositionOfColumnAndLine,
	type SourceFileWithLineMap,
} from "@flint.fyi/core";

import { errorToSvelteFailure } from "./errorToLanguageReport.ts";

const sveltePath = path.dirname(
	url.fileURLToPath(import.meta.resolve("svelte/package.json")),
);
const svelte2tsxPath = path.dirname(
	url.fileURLToPath(import.meta.resolve("svelte2tsx/package.json")),
);
const svelteHtmlPath = path.join(sveltePath, "svelte-html.d.ts");

const globalTypeImports = [
	path.join(svelte2tsxPath, "svelte-shims-v4.d.ts"),
	path.join(svelte2tsxPath, "svelte-native-jsx.d.ts"),
	fs.existsSync(svelteHtmlPath)
		? svelteHtmlPath
		: path.join(svelte2tsxPath, "svelte-jsx-v4.d.ts"),
]
	.map((file) => `import ${JSON.stringify(file)}`)
	.join("\n");

// svelte2tsx reshapes the component, so formatting and structural operations
// on its output would not describe the authored file.
const mappingFeatures =
	SPAN_MAPPING_FEATURE_ALL &
	~(
		SpanMappingFeature.Formatting |
		SpanMappingFeature.FoldingRanges |
		SpanMappingFeature.SelectionRanges |
		SpanMappingFeature.LinkedEditing |
		SpanMappingFeature.DocumentSymbols
	);

export interface SvelteTransformOptions {
	accessors?: boolean;
	namespace?: string;
}

export function transformSvelte(
	{ content, fileName }: TransformParams,
	options: SvelteTransformOptions = {},
): TransformResult {
	const isTsFile = /<script[^>]+\blang\s*=\s*["']ts["']/i.test(content);
	try {
		const transformed = svelte2tsx(content, {
			...options,
			emitJsDoc: !isTsFile,
			emitOnTemplateError: false,
			filename: fileName,
			isTsFile,
			mode: "ts",
		});
		return createMappedOutput({
			content,
			extension: ".tsx",
			mappings: sourceMapMappings(
				content,
				transformed.code,
				transformed.map.mappings,
			),
			text: `${transformed.code}\n\n${globalTypeImports}`,
		});
	} catch (error) {
		return {
			diagnostics: [errorToMapperDiagnostic(error, content.length)],
			extension: ".tsx",
			text: "",
		};
	}
}

function errorToMapperDiagnostic(
	error: unknown,
	contentLength: number,
): MapperDiagnostic {
	const failure = errorToSvelteFailure(error);
	// Svelte's string codes have no home in the protocol's numeric `code`, so
	// keep them in the message and report the generic transform-failure code.
	return {
		code: TRANSFORM_FAILURE_CODE,
		length: failure.range
			? failure.range.end - failure.range.begin
			: contentLength,
		messageText: failure.code
			? `${failure.message} (${failure.code})`
			: failure.message,
		start: failure.range?.begin ?? 0,
	};
}

function sourceMapMappings(
	content: string,
	generated: string,
	encodedMappings: string,
): SpanMapping[] {
	const source: SourceFileWithLineMap = { text: content };
	const virtual: SourceFileWithLineMap = { text: generated };
	const mappings: SpanMapping[] = [];
	let previous: undefined | { generated: number; original: number };
	for (const [generatedLine, segments] of decode(encodedMappings).entries()) {
		for (const segment of segments) {
			const generatedOffset = getPositionOfColumnAndLine(virtual, {
				column: segment[0],
				line: generatedLine,
			});
			if (previous) {
				const maximumLength = generatedOffset - previous.generated;
				let length = 0;
				while (
					length < maximumLength &&
					content[previous.original + length] ===
						generated[previous.generated + length]
				) {
					length += 1;
				}
				const last = mappings.at(-1);
				if (
					last &&
					last[0] + last[1] === previous.generated &&
					last[2] + last[3] === previous.original
				) {
					last[1] += length;
					last[3] += length;
				} else if (length > 0) {
					mappings.push([
						previous.generated,
						length,
						previous.original,
						length,
						SpanMappingKind.Verbatim,
						mappingFeatures,
					]);
				}
			}
			previous =
				segment[2] == null || segment[3] == null
					? undefined
					: {
							generated: generatedOffset,
							original: getPositionOfColumnAndLine(source, {
								column: segment[3],
								line: segment[2],
							}),
						};
		}
	}
	// svelte2tsx's segments can fall between the halves of a surrogate pair,
	// which no mapping endpoint may split.
	return mappings.flatMap(([virtualStart, length, originalStart]) => {
		const run = content.slice(originalStart, originalStart + length);
		const leading = /^[\udc00-\udfff]/.test(run) ? 1 : 0;
		const trimmedLength =
			length - leading - (/[\ud800-\udbff]$/.test(run) ? 1 : 0);
		return trimmedLength > 0
			? [
					[
						virtualStart + leading,
						trimmedLength,
						originalStart + leading,
						trimmedLength,
						SpanMappingKind.Verbatim,
						mappingFeatures,
					],
				]
			: [];
	});
}
