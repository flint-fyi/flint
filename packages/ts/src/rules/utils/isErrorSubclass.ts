import { SyntaxKind } from "typescript";
import ts from "typescript";

import type * as AST from "../../types/ast.ts";

export function isErrorSubclass(node: AST.ClassDeclaration): boolean {
	if (!node.heritageClauses) {
		return false;
	}

	for (const clause of node.heritageClauses) {
		if (clause.token !== SyntaxKind.ExtendsKeyword) {
			continue;
		}

		for (const type of clause.types) {
			const typeName = type.expression;
			if (ts.isIdentifier(typeName)) {
				const name = typeName.text;
				if (
					name === "Error" ||
					name === "TypeError" ||
					name === "RangeError" ||
					name === "SyntaxError" ||
					name === "ReferenceError" ||
					name === "EvalError" ||
					name === "URIError"
				) {
					return true;
				}
			}
		}
	}

	return false;
}
