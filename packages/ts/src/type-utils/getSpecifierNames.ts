import type { TypeOrValueSpecifier } from "./schemas.ts";

export function getSpecifierNames(
	specifier: TypeOrValueSpecifier,
): string[] | undefined {
	if (specifier.name === undefined) {
		return;
	}

	return Array.isArray(specifier.name) ? specifier.name : [specifier.name];
}
