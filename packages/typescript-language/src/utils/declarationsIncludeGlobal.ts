import type { Program } from "typescript-native/unstable/sync";

import type * as AST from "../types/ast.ts";
import { declarationIncludesGlobal } from "./declarationIncludesGlobal.ts";

export function declarationsIncludeGlobal(
	declarations: AST.Declaration[],
	program: Program,
): boolean {
	return declarations.some((declaration) =>
		declarationIncludesGlobal(declaration, program),
	);
}
