import {
	getPositionOfColumnAndLine,
	type SourceFileWithLineMap,
} from "@flint.fyi/core";
import { decode } from "@jridgewell/sourcemap-codec";
import {
	forEachEmbeddedCode,
	type CodeMapping,
	type LanguagePlugin,
	type VirtualCode,
} from "@volar/language-core";
import { svelte2tsx } from "svelte2tsx";
import type * as ts from "typescript";

// adapted from https://github.com/withastro/astro/blob/a19140fd11efbc635a391d176da54b0dc5e4a99c/packages/language-tools/ts-plugin/src/astro2tsx.ts

export const volarLanguagePlugin: LanguagePlugin<string> = {
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
					getEmbeddedTsCode(snapshot.getText(0, snapshot.getLength())),
				].filter((v) => !!v),
				mappings: [],
				codegenStacks: [],
			};
		}
	},
	updateVirtualCode(_fileNameOrUri, virtualCode, snapshot) {
		virtualCode.snapshot = snapshot;
		virtualCode.embeddedCodes = [
			getEmbeddedTsCode(snapshot.getText(0, snapshot.getLength())),
		].filter((v): v is VirtualCode => !!v);
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

function getEmbeddedTsCode(text: string): VirtualCode | undefined {
	// TODO: handle parsing errors
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
				const sourceOffset = getPositionOfColumnAndLine(sourceTextWithLineMap, {
					line: segment[2],
					column: segment[3],
				});
				current = {
					genOffset,
					sourceOffset,
				};
			}
		}
	}

	return {
		id: "tsx",
		languageId: "typescriptreact",
		snapshot: {
			getText(start, end) {
				return tsx.code.substring(start, end);
			},
			getLength() {
				return tsx.code.length;
			},
			getChangeRange() {
				return undefined;
			},
		},
		mappings: mappings,
		embeddedCodes: [],
	};
}
