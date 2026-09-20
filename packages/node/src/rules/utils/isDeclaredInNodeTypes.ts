import type { AST, Checker } from "@flint.fyi/typescript-language";

export function isDeclaredInNodeTypes(
	node: AST.Expression,
	typeChecker: Checker,
): boolean {
	const declarations = typeChecker
		.getTypeAtLocation(node)
		.getSymbol()?.declarations;

	return (
		declarations?.some((declaration) =>
			declaration
				.resolve()
				?.getSourceFile()
				.fileName.includes("node_modules/@types/node/"),
		) ?? false
	);
}
