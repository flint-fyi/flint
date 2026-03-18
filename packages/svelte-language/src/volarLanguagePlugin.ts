import {
	getPositionOfColumnAndLine,
	type LanguageFileDiagnostic,
	type SourceFileWithLineMap,
} from "@flint.fyi/core";
import { decode } from "@jridgewell/sourcemap-codec";
import {
	forEachEmbeddedCode,
	type CodeMapping,
	type LanguagePlugin,
	type VirtualCode,
} from "@volar/language-core";
import path from "node:path";
import url from "node:url";
import util from "node:util";
import type { CompileError } from "svelte/compiler";
import { svelte2tsx, internalHelpers } from "svelte2tsx";
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
			? options.options.configFilePath
			: (options.host ?? ts.sys).getCurrentDirectory();
	return {
		getLanguageId(fileName) {
			if (fileName.endsWith(".svelte")) {
				return "svelte";
			}
		},
		createVirtualCode(fileName, languageId, snapshot) {
			if (languageId === "svelte") {
				return {
					id: "root",
					languageId,
					snapshot,
					embeddedCodes: [
						getEmbeddedTsCode(
							ts,
							cwd,
							fileName,
							snapshot.getText(0, snapshot.getLength()),
						),
					],
					mappings: [],
					codegenStacks: [],
				};
			}
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
							scriptKind: 4,
							extension: ".tsx",
						};
					}
				}
			},
		},
	};
}

export const virtualCodeDiagnostics = new WeakMap<
	VirtualCode,
	LanguageFileDiagnostic
>();

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

		let current: {
			genOffset: number;
			sourceOffset: number;
		} | null = null;

		for (const [genLine, segments] of v3Mappings.entries()) {
			for (const segment of segments) {
				const genCharacter = segment[0];
				const genOffset = getPositionOfColumnAndLine(serviceTextWithLineMap, {
					line: genLine,
					column: genCharacter,
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
						if (
							lastMapping &&
							lastMapping.generatedOffsets[0]! + lastMapping.lengths[0]! ===
								current.genOffset &&
							lastMapping.sourceOffsets[0]! + lastMapping.lengths[0]! ===
								current.sourceOffset
						) {
							lastMapping.lengths[0]! += length;
						} else {
							mappings.push({
								sourceOffsets: [current.sourceOffset],
								generatedOffsets: [current.genOffset],
								lengths: [length],
								data: {
									verification: true,
									completion: true,
									semantic: true,
									navigation: true,
									structure: false,
									format: false,
								},
							});
						}
					}
					current = null;
				}
				if (segment[2] != null && segment[3] != null) {
					const sourceOffset = getPositionOfColumnAndLine(
						sourceTextWithLineMap,
						{
							line: segment[2],
							column: segment[3],
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
			id: "tsx",
			languageId: "typescriptreact",
			snapshot: {
				getText(start, end) {
					return codeWithTypes.substring(start, end);
				},
				getLength() {
					return codeWithTypes.length;
				},
				getChangeRange() {
					return undefined;
				},
			},
			mappings: mappings,
			embeddedCodes: [],
		};
	} catch (error) {
		const diagnostic = errorToLanguageDiagnostic(fileName, error);
		const code: VirtualCode = {
			id: "tsx",
			languageId: "typescriptreact",
			snapshot: {
				getText() {
					return "";
				},
				getLength() {
					return 0;
				},
				getChangeRange() {
					return undefined;
				},
			},
			mappings: [],
			embeddedCodes: [],
		};

		virtualCodeDiagnostics.set(code, diagnostic);
		return code;
	}
}

export function errorToLanguageDiagnostic(
	fileName: string,
	error: unknown,
): LanguageFileDiagnostic {
	if (typeof error != "object" || error == null) {
		return {
			text: `${fileName} - Unknown error`,
		};
	}
	const loc =
		"position" in error && Array.isArray(error.position)
			? `:${error.position[0]}:${error.position[1]}`
			: "";
	const res: LanguageFileDiagnostic = {
		text: `${fileName}${loc} - ${"message" in error ? error.message : "Codegen error"}`,
	};
	if ("code" in error && typeof error.code === "string") {
		res.code = error.code;
	}
	return res;
}
