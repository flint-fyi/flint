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

export function registerTypeScriptContentMapper(
	registration: TypeScriptContentMapperRegistration,
): () => boolean {
	registrations.add(registration);
	return () => registrations.delete(registration);
}
