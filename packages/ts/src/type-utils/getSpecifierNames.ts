import type { TypeOrValueSpecifier } from "./schemas.ts";

export function getSpecifierNames(specifier: TypeOrValueSpecifier) {
	if (specifier.name === undefined) {
		return undefined;
	}

	return Array.isArray(specifier.name) ? specifier.name : [specifier.name];
}
