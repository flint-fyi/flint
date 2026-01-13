import type { AST, Checker } from "@flint.fyi/ts";

export function isDeclaredInNodeTypes(
	node: AST.Expression,
	typeChecker: Checker,
) {
	const declarations = typeChecker
		.getTypeAtLocation(node)
		.getSymbol()
		?.getDeclarations();

	return declarations?.some((declaration) =>
		declaration.getSourceFile().fileName.includes("node_modules/@types/node/"),
	);
}
