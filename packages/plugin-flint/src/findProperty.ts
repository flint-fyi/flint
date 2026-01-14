import type { AST } from "@flint.fyi/ts";
import type ts from "typescript";
import { SyntaxKind } from "typescript";

export function findProperty<Node extends AST.Expression>(
	properties: ts.NodeArray<AST.ObjectLiteralElementLike>,
	name: string,
	predicate: (node: AST.Expression) => node is Node,
) {
	return properties.find(
		(property): property is AST.PropertyAssignment & { initializer: Node } =>
			property.kind == SyntaxKind.PropertyAssignment &&
			property.name.kind == SyntaxKind.Identifier &&
			property.name.text === name &&
			predicate(property.initializer),
	)?.initializer;
}
