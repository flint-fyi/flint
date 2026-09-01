import fs from "node:fs";
import path from "node:path";
import url from "node:url";

import { decode } from "@jridgewell/sourcemap-codec";
import type { CompileError } from "svelte/compiler";
import { svelte2tsx } from "svelte2tsx";

import {
	getPositionOfColumnAndLine,
	type LanguageReport,
	type SourceFileWithLineMap,
} from "@flint.fyi/core";
import {
	createVolarTransform,
	type MapperDiagnostic,
	type TransformParams,
	type TransformResult,
} from "@flint.fyi/volar-language";

const sveltePath = path.dirname(
	url.fileURLToPath(import.meta.resolve("svelte/package.json")),
);
const svelte2tsxPath = path.dirname(
	url.fileURLToPath(import.meta.resolve("svelte2tsx/package.json")),
);

export interface SvelteTransformOptions {
	accessors?: boolean;
	namespace?: string;
}

export function createSvelteTransform(
	options: SvelteTransformOptions = {},
): (params: TransformParams) => TransformResult {
	return (params: TransformParams): TransformResult =>
		transformSvelte(params, options);
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
		const mappings = sourceMapMappings(
			content,
			transformed.code,
			transformed.map.mappings,
		);
		const text = `${transformed.code}\n\n${globalTypeFiles()
			.map((file) => `import ${JSON.stringify(file)}`)
			.join("\n")}`;
		return createVolarTransform({
			extension: ".tsx",
			mappings,
			text,
		})({ content, fileName, projectHandle: "svelte" });
	} catch (error) {
		return {
			diagnostics: [errorToMapperDiagnostic(error, content.length)],
			extension: ".tsx",
			text: "",
		};
	}
}

function errorToLanguageReport(
	fileName: string,
	error: unknown,
): LanguageReport {
	if (typeof error !== "object" || error == null) {
		return { source: "svelte", text: `${fileName} - Unknown error` };
	}
	const svelteError = isSvelteCompileError(error) ? error : undefined;
	const location = svelteError?.start
		? `:${svelteError.start.line}:${svelteError.start.column}`
		: "";
	return {
		...(typeof svelteError?.code === "string"
			? { code: svelteError.code }
			: {}),
		...(svelteError?.start && {
			range: {
				begin: svelteError.start.character,
				end: svelteError.end?.character ?? svelteError.start.character,
			},
		}),
		source: "svelte",
		text: `${fileName}${location} - ${"message" in error && typeof error.message === "string" ? error.message : "Codegen error"}`,
	};
}

function errorToMapperDiagnostic(
	error: unknown,
	contentLength: number,
): MapperDiagnostic {
	const report = errorToLanguageReport("", error);
	return {
		...(typeof report.code === "number" ? { code: report.code } : {}),
		length: report.range
			? report.range.end - report.range.begin
			: contentLength,
		messageText: report.text.replace(/^(?::\d+:\d+)? - /, ""),
		start: report.range?.begin ?? 0,
	};
}

function globalTypeFiles(): string[] {
	const files = ["svelte-shims-v4.d.ts", "svelte-native-jsx.d.ts"];
	const svelteHtmlPath = path.join(sveltePath, "svelte-html.d.ts");
	if (fs.existsSync(svelteHtmlPath)) {
		return [
			...files.map((file) => path.resolve(svelte2tsxPath, file)),
			svelteHtmlPath,
		];
	}
	files.push("svelte-jsx-v4.d.ts");
	return files.map((file) => path.resolve(svelte2tsxPath, file));
}

function isSvelteCompileError(error: object): error is CompileError {
	return (
		"start" in error &&
		typeof error.start === "object" &&
		error.start !== null &&
		"character" in error.start
	);
}

function sourceMapMappings(
	content: string,
	generated: string,
	encodedMappings: string,
) {
	const source: SourceFileWithLineMap = { text: content };
	const virtual: SourceFileWithLineMap = { text: generated };
	const mappings: {
		data: {
			completion: true;
			navigation: true;
			semantic: true;
			verification: true;
		};
		generatedOffsets: number[];
		lengths: number[];
		sourceOffsets: number[];
	}[] = [];
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
				if (length > 0) {
					mappings.push({
						data: {
							completion: true,
							navigation: true,
							semantic: true,
							verification: true,
						},
						generatedOffsets: [previous.generated],
						lengths: [length],
						sourceOffsets: [previous.original],
					});
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
	return mappings;
}
