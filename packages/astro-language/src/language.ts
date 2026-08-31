import { parse } from "@astrojs/compiler/sync";
import type { RootNode } from "@astrojs/compiler/types";
import { getLanguagePlugin } from "@astrojs/ts-plugin/dist/language.js";
import type ts from "typescript";

import type { SourceFileWithLineMap } from "@flint.fyi/core";
import { setTSExtraSupportedExtensions } from "@flint.fyi/ts-patch";
import {
	createVolarBasedLanguage,
	type VolarLanguage,
} from "@flint.fyi/volar-language";

import { astroCompilerDiagnosticToLanguageReport } from "./astroCompilerDiagnosticToLanguageReport.ts";
import { extractDirectives } from "./extractDirectives.ts";

setTSExtraSupportedExtensions([".astro"]);

export interface AstroServices {
	astro: {
		ast: RootNode;
	};
}

// Astro's language server injects these same type files through getScriptFileNames:
// https://github.com/withastro/astro/blob/c0f33eda8adf6f8f2588688f6205b76a96a42466/packages/language-tools/language-server/src/core/index.ts#L31-L81
function addAstroTypes(
	typescript: typeof ts,
	options: ts.CreateProgramOptions,
) {
	const astroRootNames = options.rootNames.filter((fileName) =>
		fileName.endsWith(".astro"),
	);
	if (!astroRootNames.length) {
		return;
	}

	const host = options.host ?? typescript.sys;
	const cache = options.host?.getModuleResolutionCache?.();
	const astroTypeRootNames: string[] = [];
	for (const moduleName of ["astro/env", "astro/astro-jsx"]) {
		const fileName = resolveModuleFileName(
			typescript,
			options,
			host,
			cache,
			moduleName,
			astroRootNames,
		);
		if (fileName != null && !options.rootNames.includes(fileName)) {
			astroTypeRootNames.push(fileName);
		}
	}

	if (!astroTypeRootNames.length) {
		return;
	}

	options.rootNames = [...options.rootNames, ...astroTypeRootNames];
}

function resolveModuleFileName(
	typescript: typeof ts,
	options: ts.CreateProgramOptions,
	host: ts.ModuleResolutionHost,
	cache: ts.ModuleResolutionCache | undefined,
	moduleName: string,
	containingFileNames: string[],
) {
	for (const containingFileName of containingFileNames) {
		const resolved = typescript.resolveModuleName(
			moduleName,
			containingFileName,
			options.options,
			host,
			cache,
		).resolvedModule?.resolvedFileName;
		if (resolved != null) {
			return resolved;
		}
	}
}

export const astroLanguage: VolarLanguage<AstroServices> =
	createVolarBasedLanguage((typescript, options) => {
		addAstroTypes(typescript, options);

		return {
			createFile({ sourceFile, sourceScript }) {
				const sourceText = sourceScript.snapshot.getText(
					0,
					sourceScript.snapshot.getLength(),
				);
				const { ast, diagnostics } = parse(sourceText, { position: true });
				const source: SourceFileWithLineMap = { text: sourceText };
				return {
					directives: extractDirectives(ast),
					extraContext: {
						astro: {
							ast,
						},
					},
					firstStatementPosition:
						ast.children[0]?.position?.start.offset ?? sourceText.length,
					getLanguageReports() {
						return diagnostics.map((diagnostic) =>
							astroCompilerDiagnosticToLanguageReport(
								sourceFile.fileName,
								source,
								diagnostic,
							),
						);
					},
				};
			},
			languagePlugins: [getLanguagePlugin()],
		};
	});
