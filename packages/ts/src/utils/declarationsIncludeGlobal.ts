import type ts from "typescript";

import { declarationIncludesGlobal } from "./declarationIncludesGlobal.ts";

export function declarationsIncludeGlobal(declarations: ts.Declaration[]) {
	return declarations.some(declarationIncludesGlobal);
}
