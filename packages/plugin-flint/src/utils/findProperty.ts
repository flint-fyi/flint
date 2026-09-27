import { SyntaxKind, type NodeArray } from "typescript-native/unstable/ast";

import type { AST } from "@flint.fyi/typescript-language";

export function findProperty<Node extends AST.Expression>(
	properties: NodeArray<AST.ObjectLiteralElementLike>,
	name: string,
	predicate: (node: AST.Expression) => node is Node,
): Node | undefined {
	return properties.find(
		(property): property is AST.PropertyAssignment & { initializer: Node } =>
			property.kind === SyntaxKind.PropertyAssignment &&
			property.name.kind === SyntaxKind.Identifier &&
			property.name.text === name &&
			predicate(property.initializer),
	)?.initializer;
}
