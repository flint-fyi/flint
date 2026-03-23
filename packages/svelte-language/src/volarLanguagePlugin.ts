import {
	getPositionOfColumnAndLine,
	type LanguageReport,
	type SourceFileWithLineMap,
} from "@flint.fyi/core";
import { decode } from "@jridgewell/sourcemap-codec";
import {
	type CodeMapping,
	forEachEmbeddedCode,
	type LanguagePlugin,
	type VirtualCode,
} from "@volar/language-core";
import path from "node:path";
import url from "node:url";
import { internalHelpers, svelte2tsx } from "svelte2tsx";
import type * as ts from "typescript";

const sveltePath = path.dirname(
	url.fileURLToPath(import.meta.resolve("svelte/package.json")),
);
const svelte2tsxPath = path.dirname(
	url.fileURLToPath(import.meta.resolve("svelte2tsx/package.json")),
);

export function volarLanguagePlugin(
	ts: typeof import("typescript"),
	options: ts.CreateProgramOptions,
): LanguagePlugin<string> {
	const cwd =
		typeof options.options.configFilePath === "string"
			? path.dirname(options.options.configFilePath)
			: (options.host ?? ts.sys).getCurrentDirectory();
	return {
		createVirtualCode(fileName, languageId, snapshot) {
			if (languageId !== "svelte") {
				return undefined;
			}
			return {
				codegenStacks: [],
				embeddedCodes: [
					getEmbeddedTsCode(
						ts,
						cwd,
						fileName,
						snapshot.getText(0, snapshot.getLength()),
					),
				],
				id: "root",
				languageId,
				mappings: [],
				snapshot,
			};
		},
		getLanguageId(fileName) {
			if (fileName.endsWith(".svelte")) {
				return "svelte";
			}
			return undefined;
		},
		typescript: {
			extraFileExtensions: [
				{
					extension: "svelte",
					isMixedContent: true,
					scriptKind: 7 satisfies ts.ScriptKind.Deferred,
				},
			],
			getServiceScript(root) {
				for (const code of forEachEmbeddedCode(root)) {
					if (code.id === "tsx") {
						return {
							code,
							extension: ".tsx",
							scriptKind: 4 satisfies ts.ScriptKind.TSX,
						};
					}
				}
				return undefined;
			},
		},
		updateVirtualCode(fileName, virtualCode, snapshot) {
			virtualCode.snapshot = snapshot;
			virtualCode.embeddedCodes = [
				getEmbeddedTsCode(
					ts,
					cwd,
					fileName,
					snapshot.getText(0, snapshot.getLength()),
				),
			];
			return virtualCode;
		},
	};
}

export const virtualCodeReports = new WeakMap<VirtualCode, LanguageReport>();

export function errorToLanguageReport(
	fileName: string,
	error: unknown,
): LanguageReport {
	if (typeof error !== "object" || error == null) {
		return {
			text: `${fileName} - Unknown error`,
		};
	}
	const loc =
		"position" in error && Array.isArray(error.position)
			? `:${error.position[0]}:${error.position[1]}`
			: "";
	const res: LanguageReport = {
		text: `${fileName}${loc} - ${"message" in error && typeof error.message === "string" ? error.message : "Codegen error"}`,
	};
	if ("code" in error && typeof error.code === "string") {
		res.code = error.code;
	}
	return res;
}

// adapted from https://github.com/withastro/astro/blob/a19140fd11efbc635a391d176da54b0dc5e4a99c/packages/language-tools/ts-plugin/src/astro2tsx.ts
function getEmbeddedTsCode(
	ts: typeof import("typescript"),
	cwd: string,
	fileName: string,
	text: string,
): VirtualCode {
	const svelteTsxFiles = internalHelpers.get_global_types(
		ts.sys,
		false,
		sveltePath,
		svelte2tsxPath,
		cwd,
	);
	try {
		const tsx = svelte2tsx(text, {
			isTsFile: true,
			mode: "ts",
		});
		const v3Mappings = decode(tsx.map.mappings);
		const sourceTextWithLineMap: SourceFileWithLineMap = {
			text,
		};
		const serviceTextWithLineMap: SourceFileWithLineMap = {
			text: tsx.code,
		};
		const mappings: CodeMapping[] = [];

		let current: null | {
			genOffset: number;
			sourceOffset: number;
		} = null;

		for (const [genLine, segments] of v3Mappings.entries()) {
			for (const segment of segments) {
				const genCharacter = segment[0];
				const genOffset = getPositionOfColumnAndLine(serviceTextWithLineMap, {
					column: genCharacter,
					line: genLine,
				});
				if (current != null) {
					let length = genOffset - current.genOffset;
					const sourceText = text.substring(
						current.sourceOffset,
						current.sourceOffset + length,
					);
					const genText = tsx.code.substring(
						current.genOffset,
						current.genOffset + length,
					);
					if (sourceText !== genText) {
						length = 0;
						for (let i = 0; i < genOffset - current.genOffset; i++) {
							if (sourceText[i] === genText[i]) {
								length = i + 1;
							} else {
								break;
							}
						}
					}
					if (length > 0) {
						const lastMapping = mappings.at(-1);
						// mappings always contain one range
						/* eslint-disable @typescript-eslint/no-non-null-assertion */
						if (
							lastMapping &&
							current.genOffset ===
								lastMapping.generatedOffsets[0]! + lastMapping.lengths[0]! &&
							current.sourceOffset ===
								lastMapping.sourceOffsets[0]! + lastMapping.lengths[0]!
						) {
							lastMapping.lengths[0]! += length;
							/* eslint-enable @typescript-eslint/no-non-null-assertion */
						} else {
							mappings.push({
								data: {
									completion: true,
									format: false,
									navigation: true,
									semantic: true,
									structure: false,
									verification: true,
								},
								generatedOffsets: [current.genOffset],
								lengths: [length],
								sourceOffsets: [current.sourceOffset],
							});
						}
					}
					current = null;
				}
				if (segment[2] != null && segment[3] != null) {
					const sourceOffset = getPositionOfColumnAndLine(
						sourceTextWithLineMap,
						{
							column: segment[3],
							line: segment[2],
						},
					);
					current = {
						genOffset,
						sourceOffset,
					};
				}
			}
		}

		const codeWithTypes =
			tsx.code +
			"\n\n" +
			svelteTsxFiles.map((p) => `import ${JSON.stringify(p)}`).join("\n");

		return {
			embeddedCodes: [],
			id: "tsx",
			languageId: "typescriptreact",
			mappings,
			snapshot: {
				getChangeRange() {
					return undefined;
				},
				getLength() {
					return codeWithTypes.length;
				},
				getText(start, end) {
					return codeWithTypes.substring(start, end);
				},
			},
		};
	} catch (error) {
		const report = errorToLanguageReport(fileName, error);
		const code: VirtualCode = {
			embeddedCodes: [],
			id: "tsx",
			languageId: "typescriptreact",
			mappings: [],
			snapshot: {
				getChangeRange() {
					return undefined;
				},
				getLength() {
					return 0;
				},
				getText() {
					return "";
				},
			},
		};

		virtualCodeReports.set(code, report);
		return code;
	}
}
