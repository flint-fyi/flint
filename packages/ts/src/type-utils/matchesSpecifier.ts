import type ts from "typescript";

import { declarationIncludesGlobal } from "@flint.fyi/typescript-language";

import { getSpecifierNames } from "./getSpecifierNames.ts";
import { isFromFile } from "./isFromFile.ts";
import { isFromPackage } from "./isFromPackage.ts";
import type { TypeOrValueSpecifier } from "./schemas.ts";

// TODO: Investigate unifying this with / contributing upstream to typescript-eslint
export function matchesSpecifier(
	importedName: string | undefined,
	declarations: ts.Declaration[],
	specifier: TypeOrValueSpecifier,
	program: ts.Program,
) {
	const names = getSpecifierNames(specifier);
	if (
		names !== undefined &&
		(importedName === undefined || !names.includes(importedName))
	) {
		return false;
	}

	return declarations.some((declaration) => {
		switch (specifier.from) {
			case "file":
				return isFromFile(declaration.getSourceFile(), specifier.path, program);
			case "lib":
				return declarationIncludesGlobal(declaration);
			case "package":
				return isFromPackage(declaration, specifier.package, program);
		}
	});
}
