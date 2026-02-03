import * as ts from "typescript";

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
			case ts.SyntaxKind.Block:
			case ts.SyntaxKind.CaseBlock:
			case ts.SyntaxKind.CaseClause:
			case ts.SyntaxKind.CatchClause:
			case ts.SyntaxKind.DefaultClause:
			case ts.SyntaxKind.DoStatement:
			case ts.SyntaxKind.ForInStatement:
			case ts.SyntaxKind.ForOfStatement:
			case ts.SyntaxKind.ForStatement:
			case ts.SyntaxKind.IfStatement:
			case ts.SyntaxKind.LabeledStatement:
			case ts.SyntaxKind.SwitchStatement:
			case ts.SyntaxKind.TryStatement:
			case ts.SyntaxKind.WhileStatement:
			case ts.SyntaxKind.WithStatement:
				return ts.forEachChild(node, traverse);

			case ts.SyntaxKind.ReturnStatement:
				return visitor(node as ts.ReturnStatement);
		}

		return undefined;
	}
}
