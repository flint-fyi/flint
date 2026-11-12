import type { NodeHandle } from "typescript-native/sync";

import type * as AST from "../types/ast.ts";

/**
 * Resolves a symbol's declaration handles to their nodes.
 * @returns `undefined` if any handle fails to resolve, so callers never judge
 * a symbol from only some of its declarations.
 */
export function resolveDeclarations(
	handles: readonly NodeHandle[],
): AST.Declaration[] | undefined {
	const declarations: AST.Declaration[] = [];
	for (const handle of handles) {
		const declaration = handle.resolve();
		if (!declaration) {
			return undefined;
		}
		declarations.push(declaration as AST.Declaration);
	}
	return declarations;
}
