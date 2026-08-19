import type ts from "typescript";

import typescript, {
	SyntaxKind,
} from "@flint.fyi/typescript-language/typescript";

// Copied from typescript https://github.com/microsoft/TypeScript/blob/42b0e3c4630c129ca39ce0df9fff5f0d1b4dd348/src/compiler/utilities.ts#L1335
// Warning: This has the same semantics as the forEach family of functions,
//          in that traversal terminates in the event that 'visitor' supplies a truthy value.
export function forEachReturnStatement<T>(
	body: ts.Block,
	visitor: (statement: ts.ReturnStatement) => T,
): T | undefined {
	return traverse(body);

	function traverse(node: ts.Node): T | undefined {
		switch (node.kind) {
			case SyntaxKind.Block:
			case SyntaxKind.CaseBlock:
			case SyntaxKind.CaseClause:
			case SyntaxKind.CatchClause:
			case SyntaxKind.DefaultClause:
			case SyntaxKind.DoStatement:
			case SyntaxKind.ForInStatement:
			case SyntaxKind.ForOfStatement:
			case SyntaxKind.ForStatement:
			case SyntaxKind.IfStatement:
			case SyntaxKind.LabeledStatement:
			case SyntaxKind.SwitchStatement:
			case SyntaxKind.TryStatement:
			case SyntaxKind.WhileStatement:
			case SyntaxKind.WithStatement:
				return typescript.forEachChild(node, traverse);

			case SyntaxKind.ReturnStatement:
				return visitor(node as ts.ReturnStatement);
		}

		return undefined;
	}
}
