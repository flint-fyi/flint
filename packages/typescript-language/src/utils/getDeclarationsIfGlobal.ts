import type { Program } from "typescript-native/unstable/sync";

import type * as AST from "../types/ast.ts";
import type { Checker } from "../types/checker.ts";
import { declarationsIncludeGlobal } from "./declarationsIncludeGlobal.ts";

export function getDeclarationsIfGlobal(
	node: AST.Expression,
	checker: Checker,
	program: Program,
): AST.Declaration[] | undefined {
	const declarations = checker
		.getSymbolAtLocation(node)
		?.declarations.map((declaration) => declaration.resolve())
		.filter((declaration): declaration is AST.Declaration => !!declaration);

	return declarations?.length &&
		declarationsIncludeGlobal([...declarations], program)
		? [...declarations]
		: undefined;
}
