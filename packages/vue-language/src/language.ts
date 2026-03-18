import { setTSExtraSupportedExtensions } from "@flint.fyi/ts-patch";
import { assert, nullThrows } from "@flint.fyi/utils";
import { createVolarBasedLanguage } from "@flint.fyi/volar-language";
import type { Mapper as VolarMapper } from "@volar/language-core";
import { NodeTypes, type RootNode, parse as vueParse } from "@vue/compiler-dom";
import {
	createVueLanguagePlugin,
	createParsedCommandLine as createVueParsedCommandLine,
	createParsedCommandLineByJson as createVueParsedCommandLineByJson,
	tsCodegen,
	VueVirtualCode,
} from "@vue/language-core";

import { extractTemplateDirectives } from "./extractTemplateDirectives.ts";
import { vueParsingErrorsToLanguageDiagnostics } from "./vueParsingErrorsToLanguageDiagnostics.ts";

setTSExtraSupportedExtensions([".vue"]);

export interface VueServices {
	vue: {
		codegen: VueCodegen;
		map: VolarMapper;
		sfc: RootNode;
		virtualCode: VueVirtualCode;
	};
}

type VueCodegen =
	typeof tsCodegen extends WeakMap<WeakKey, infer V> ? V : never;

export const vueLanguage = createVolarBasedLanguage<VueServices>(
	(ts, options) => {
		const { configFilePath } = options.options;
		const host = options.host
			? {
					...options.host,
					useCaseSensitiveFileNames: options.host.useCaseSensitiveFileNames(),
				}
			: ts.sys;
		const vueCompilerOptions = (
			typeof configFilePath === "string"
				? createVueParsedCommandLine(
						ts,
						host,
						configFilePath.replaceAll("\\", "/"),
					)
				: createVueParsedCommandLineByJson(
						ts,
						host,
						host.getCurrentDirectory(),
						{},
					)
		).vueOptions;

		return {
			createFile({
				data,
				serviceScript,
				sourceFile,
				sourceScript,
				volarLanguage,
			}) {
				const sourceText = sourceScript.snapshot.getText(
					0,
					sourceScript.snapshot.getLength(),
				);
				const virtualCode = sourceScript.generated.root;
				assert(
					virtualCode instanceof VueVirtualCode,
					"Expected sourceScript.generated.root to be VueServiceCode",
				);

				const codegen = nullThrows(
					tsCodegen.get(virtualCode.sfc),
					`tsCodegen for ${data.filePathAbsolute} is undefined`,
				);

				const map = volarLanguage.maps.get(serviceScript.code, sourceScript);

				const sfcAst = vueParse(sourceText, {
					comments: true,
					expressionPlugins: ["typescript"],
					onError: () => {
						// We ignore errors because virtual code already provides them,
						// and it also provides them with sourceText-based locations,
						// so we don't have to remap them. Oh, and it also contains errors from
						// other blocks rather than only <template> as well.
						// If we don't provide this callback, @vue/compiler-core will throw.
					},
					parseMode: "html",
				});

				return {
					// TODO: extract directives from other blocks too
					directives: extractTemplateDirectives(sfcAst),
					extraContext: {
						vue: {
							codegen,
							map,
							sfc: sfcAst,
							virtualCode,
						},
					},
					firstStatementPosition:
						sfcAst.children.find((c) => c.type !== NodeTypes.COMMENT)?.loc.start
							.offset ?? sourceText.length,
					getDiagnostics() {
						return vueParsingErrorsToLanguageDiagnostics(
							sourceFile.fileName.startsWith("./")
								? sourceFile.fileName.slice(2)
								: // TODO: use LinterHost.getCurrentDirectory()
									sourceFile.fileName.slice(process.cwd().length + 1),
							virtualCode.vueSfc?.errors ?? [],
						);
					},
				};
			},
			languagePlugins: [
				createVueLanguagePlugin<string>(
					ts,
					options.options,
					vueCompilerOptions,
					(id) => id,
				),
			],
		};
	},
);
