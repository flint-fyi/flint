import type ts from "typescript";

import typescript from "@flint.fyi/typescript-language/typescript";

// TODO (#400): Switch to scope analysis
export function isDeclaredInModuleBlock(
	declaration: ts.Declaration,
	packageName: string,
): boolean {
	let current: ts.Node = declaration;
	while (!typescript.isSourceFile(current)) {
		if (
			typescript.isModuleDeclaration(current) &&
			!(current.flags & typescript.NodeFlags.Namespace) &&
			typescript.isStringLiteral(current.name) &&
			current.name.text === packageName
		) {
			return true;
		}
		current = current.parent;
	}
	return false;
}
