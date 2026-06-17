import ts from "typescript";

/**
 * Inspects top-level statements of a TS source file to determine
 * if it introduces or modifies entities in the global scope.
 */
export function containsGlobalDeclarations(sourceFileNode: ts.SourceFile) {
	const isModule = ts.isExternalModule(sourceFileNode);

	return sourceFileNode.statements.some((statement) => {
		// Checks for 'declare global {}'
		if (ts.isModuleDeclaration(statement) && statement.name.text === "global") {
			return true;
		}

		// In a module file, bare `declare` statements are local to the module
		if (isModule) {
			return false;
		}

		// In a script file, top-level `declare` statements affect the global scope
		const canHaveModifiers = ts.canHaveModifiers(statement);
		if (!canHaveModifiers) {
			return false;
		}

		const modifiers = ts.getModifiers(statement);
		return modifiers?.some((mod) => mod.kind === ts.SyntaxKind.DeclareKeyword);
	});
}
