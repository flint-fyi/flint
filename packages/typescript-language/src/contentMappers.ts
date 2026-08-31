import { assert } from "@flint.fyi/utils";

import packageJson from "../package.json" with { type: "json" };

export interface TypeScriptContentMapperRegistration {
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
		extensions: [...registration.extensions],
		...(registration.options && {
			options: structuredClone(registration.options),
		}),
		packageName: registration.packageName,
	};
}
