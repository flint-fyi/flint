import type { NodeHandle, Program } from "typescript-native/sync";

import type * as AST from "../types/ast.ts";
import { declarationIncludesGlobal } from "./declarationIncludesGlobal.ts";

export function declarationsIncludeGlobal(
	declarations: readonly (AST.Declaration | NodeHandle)[],
	program: Program,
): boolean {
	return declarations.some((declaration) =>
		declarationIncludesGlobal(declaration, program),
	);
}
