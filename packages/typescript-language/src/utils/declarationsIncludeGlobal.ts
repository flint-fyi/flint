import type { Declaration, Program } from "typescript";

import { declarationIncludesGlobal } from "./declarationIncludesGlobal.ts";

export function declarationsIncludeGlobal(
	declarations: Declaration[],
	program: Program,
): boolean {
	return declarations.some((declaration) =>
		declarationIncludesGlobal(declaration, program),
	);
}
