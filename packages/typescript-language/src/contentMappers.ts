import type {
	CommentDirective,
	FileAboutData,
	FileReport,
	LanguageReports,
} from "@flint.fyi/core";

import type * as AST from "./types/ast.ts";
import type { TypeScriptFileServices } from "./types/services.ts";

export interface TypeScriptContentMapperRegistration {
	createFile?: (context: {
		about: FileAboutData;
		services: TypeScriptFileServices;
		sourceFile: AST.SourceFile;
		sourceText: string;
	}) => {
		directives?: CommentDirective[];
		languageReports?: LanguageReports;
		reports?: FileReport[];
		services?: object;
	};
	extensions: string[];
	options?: Record<string, unknown>;
	packageName: string;
}

const registrations = new Set<TypeScriptContentMapperRegistration>();

export function getTypeScriptContentMapperRegistrations(): TypeScriptContentMapperRegistration[] {
	return [...registrations];
}

/**
 * Registers a content mapper under a default package name, returning a
 * function that re-registers it under a different one.
 *
 * Framework plugins (`@flint.fyi/svelte`) re-point their language package's
 * mapper at themselves so TypeScript execs the plugin's own mapper binary.
 */
export function createContentMapperRegistrar(
	defaults: TypeScriptContentMapperRegistration,
): (packageName: string) => void {
	let unregister = registerTypeScriptContentMapper(defaults);
	return (packageName: string) => {
		unregister();
		unregister = registerTypeScriptContentMapper({ ...defaults, packageName });
	};
}

export function registerTypeScriptContentMapper(
	registration: TypeScriptContentMapperRegistration,
): () => boolean {
	registrations.add(registration);
	return () => registrations.delete(registration);
}
