import {
	type AST,
	type Checker,
	isGlobalDeclaration,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

const builtinErrorNames = new Set([
	"Error",
	"EvalError",
	"RangeError",
	"ReferenceError",
	"SyntaxError",
	"TypeError",
	"URIError",
]);

export function isErrorSubclass(
	node: AST.ClassDeclaration,
	typeChecker: Checker,
): boolean {
	if (!node.heritageClauses) {
		return false;
	}

	for (const clause of node.heritageClauses) {
		if (clause.token !== ts.SyntaxKind.ExtendsKeyword) {
			continue;
		}

		for (const type of clause.types) {
			const typeName = type.expression;
			if (
				ts.isIdentifier(typeName) &&
				builtinErrorNames.has(typeName.text) &&
				isGlobalDeclaration(typeName, typeChecker)
			) {
				return true;
			}
		}
	}

	return false;
}
