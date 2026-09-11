import { NodeFlags, SyntaxKind, type Declaration } from "typescript";

import type { AST } from "@flint.fyi/typescript-language";

// TODO (#400): Switch to scope analysis
export function isDeclaredInModuleBlock(
	declaration: Declaration,
	packageName: string,
): boolean {
	let current = declaration as AST.AnyNode;
	while (current.kind !== SyntaxKind.SourceFile) {
		if (
			current.kind === SyntaxKind.ModuleDeclaration &&
			!(current.flags & NodeFlags.Namespace) &&
			current.name.kind === SyntaxKind.StringLiteral &&
			current.name.text === packageName
		) {
			return true;
		}
		current = current.parent;
	}
	return false;
}
