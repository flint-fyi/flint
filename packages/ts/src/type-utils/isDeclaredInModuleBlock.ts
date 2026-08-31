import {
	NodeFlags,
	SyntaxKind,
	type Node,
} from "typescript-native/unstable/ast";

import type { AST } from "@flint.fyi/typescript-language";

// TODO (#400): Switch to scope analysis
export function isDeclaredInModuleBlock(
	declaration: AST.Declaration,
	packageName: string,
): boolean {
	let current: Node = declaration;
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
