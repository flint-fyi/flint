import type { AST } from "@flint.fyi/typescript-language";
import { SyntaxKind } from "@flint.fyi/typescript-language/native/ast";

// TODO (#400): Switch to scope analysis
export function isDeclaredInModuleBlock(
	declaration: AST.Declaration,
	packageName: string,
): boolean {
	let current: AST.Node = declaration;
	while (current.kind !== SyntaxKind.SourceFile) {
		if (
			current.kind === SyntaxKind.ModuleDeclaration &&
			current.name.kind === SyntaxKind.StringLiteral &&
			current.name.text === packageName
		) {
			return true;
		}
		current = current.parent;
	}
	return false;
}
