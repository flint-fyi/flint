#!/usr/bin/env node
import path from "node:path";
import url from "node:url";

import { parse } from "@astrojs/compiler/sync";
import type { ElementNode, ParentNode } from "@astrojs/compiler/types";
import { astro2tsx } from "@astrojs/ts-plugin/dist/astro2tsx.js";

import { getPositionOfColumnAndLine } from "@flint.fyi/core";
import {
	createVolarTransform,
	runContentMapper,
	type ContentMapperProject,
	type TransformParams,
	type TransformResult,
	type VolarTransformSource,
} from "@flint.fyi/volar-language";

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
	const canonical = diagnostics.length
		? { extension: ".tsx", mappings: [], text }
		: createVolarTransform({
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
			mappings: [[0, end - start, start, end - start, 0]],
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
	mappings: VolarTransformSource["mappings"],
	generatedText: string,
	originalText: string,
): VolarTransformSource["mappings"] {
	const flattened: {
		data: VolarTransformSource["mappings"][number]["data"];
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

if (
	process.argv[1] &&
	path.resolve(process.argv[1]) === url.fileURLToPath(import.meta.url)
) {
	await runContentMapper({
		diagnosticSource: "astro",
		openProject: openAstroProject,
	});
}
