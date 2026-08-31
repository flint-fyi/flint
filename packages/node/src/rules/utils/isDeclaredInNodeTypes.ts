import type { AST, Checker } from "@flint.fyi/typescript-language";

export function isDeclaredInNodeTypes(
	node: AST.Expression,
	checker: Checker,
): boolean {
	const declarations = checker
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
