import { isIdentifier, SyntaxKind, type Program } from "typescript";

import {
	isGlobalDeclaration,
	type AST,
	type Checker,
} from "@flint.fyi/typescript-language";

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
	program: Program,
): boolean {
	if (!node.heritageClauses) {
		return false;
	}

	for (const clause of node.heritageClauses) {
		if (clause.token !== SyntaxKind.ExtendsKeyword) {
			continue;
		}

		for (const type of clause.types) {
			const typeName = type.expression;
			if (
				isIdentifier(typeName) &&
				builtinErrorNames.has(typeName.text) &&
				isGlobalDeclaration(typeName, typeChecker, program)
			) {
				return true;
			}
		}
	}

	return false;
}
