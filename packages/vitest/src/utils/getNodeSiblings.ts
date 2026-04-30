import type { AST } from "@flint.fyi/typescript-language";
import ts from "typescript";

export function getNodeSiblings(node: AST.AnyNode) {
	let next: AST.AnyNode | undefined;
	let previous: AST.AnyNode | undefined;
	let foundNode = false;

	ts.forEachChild(node.parent, (sibling) => {
		if (sibling === node) {
			foundNode = true;
			return;
		}

		if (!foundNode) {
			previous = sibling as AST.AnyNode;
			return;
		}

		next = sibling as AST.AnyNode;
		return true;
	});

	return { next, previous };
}
