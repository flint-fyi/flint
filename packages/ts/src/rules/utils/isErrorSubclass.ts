import {
	isGlobalDeclaration,
	type AST,
	type Checker,
} from "@flint.fyi/typescript-language";
import { SyntaxKind } from "@flint.fyi/typescript-language/native/ast";
import type { Program } from "@flint.fyi/typescript-language/native/sync";

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
			if (type.kind !== SyntaxKind.ExpressionWithTypeArguments) {
				continue;
			}
			const typeName = type.expression;
			if (
				typeName.kind === SyntaxKind.Identifier &&
				builtinErrorNames.has(typeName.text) &&
				isGlobalDeclaration(typeName, typeChecker, program)
			) {
				return true;
			}
		}
	}

	return false;
}
