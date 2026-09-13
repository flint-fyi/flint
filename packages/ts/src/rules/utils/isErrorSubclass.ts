import { SyntaxKind } from "typescript-native/unstable/ast";
import type { Program } from "typescript-native/unstable/sync";

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
