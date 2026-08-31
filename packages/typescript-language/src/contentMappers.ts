import type {
	CommentDirective,
	FileAboutData,
	FileReport,
} from "@flint.fyi/core";
import { assert } from "@flint.fyi/utils";

import packageJson from "../package.json" with { type: "json" };
import type { TypeScriptFileServices } from "./language.ts";
import type * as AST from "./types/ast.ts";

export interface TypeScriptContentMapperRegistration {
	createFile?: (context: {
		about: FileAboutData;
		services: TypeScriptFileServices;
		sourceFile: AST.SourceFile;
		sourceText: string;
	}) => {
		directives?: CommentDirective[];
		reports?: FileReport[];
		services?: object;
	};
	extensions: string[];
	options?: Record<string, unknown>;
	packageName: string;
}

interface ContentMapperState {
	packageVersion: string;
	registrations: Set<TypeScriptContentMapperRegistration>;
}

const stateSymbol = Symbol.for(
	"@flint.fyi/typescript-language/content-mappers-state",
);
const globalTyped = globalThis as typeof globalThis & {
	[stateSymbol]?: ContentMapperState;
};

assert(
	globalTyped[stateSymbol] == null,
	`Two different versions of ${packageJson.name} are imported: ${packageJson.version} and ${globalTyped[stateSymbol]?.packageVersion}`,
);

const contentMapperState: ContentMapperState = (globalTyped[stateSymbol] = {
	packageVersion: packageJson.version,
	registrations: new Set(),
});

export function getTypeScriptContentMapperRegistrations(): TypeScriptContentMapperRegistration[] {
	return Array.from(contentMapperState.registrations, cloneRegistration);
}

export function registerTypeScriptContentMapper(
	registration: TypeScriptContentMapperRegistration,
): () => boolean {
	const storedRegistration = cloneRegistration(registration);
	contentMapperState.registrations.add(storedRegistration);
	return () => contentMapperState.registrations.delete(storedRegistration);
}

function cloneRegistration(
	registration: TypeScriptContentMapperRegistration,
): TypeScriptContentMapperRegistration {
	return {
		...(registration.createFile && { createFile: registration.createFile }),
		extensions: [...registration.extensions],
		...(registration.options && {
			options: structuredClone(registration.options),
		}),
		packageName: registration.packageName,
	};
}
