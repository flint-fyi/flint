import ts from "typescript";

export function resolveModuleSourceFiles(
	typeChecker: Pick<ts.TypeChecker, "getAliasedSymbol" | "getSymbolAtLocation">,
	literal: ts.Expression,
	eligible: ReadonlySet<ts.SourceFile>,
): ts.SourceFile[] | undefined {
	let symbol = typeChecker.getSymbolAtLocation(literal);
	while (symbol && symbol.flags & ts.SymbolFlags.Alias) {
		symbol = typeChecker.getAliasedSymbol(symbol);
	}
	return symbol?.declarations?.filter(
		(declaration): declaration is ts.SourceFile =>
			ts.isSourceFile(declaration) && eligible.has(declaration),
	);
}
