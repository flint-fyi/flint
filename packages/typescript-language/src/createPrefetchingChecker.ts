import { SyntaxKind, type Node } from "typescript-native/unstable/ast";
import type { Checker, Symbol } from "typescript-native/unstable/sync";

import type * as AST from "./types/ast.ts";
import { forEachChild } from "./utils/forEachChild.ts";

/**
 * Wraps a project's checker so that a file's symbols are fetched in one
 * request rather than one request per node.
 *
 * Every checker query is a synchronous round trip to the native process, and
 * several rules ask for the symbol of every identifier they visit. The first
 * single-node `getSymbolAtLocation` for a node this covers resolves all such
 * nodes in the file at once, and later lookups are answered from that result.
 * Nothing is fetched until a rule asks, so files no rule queries cost nothing
 * extra. Other nodes and other queries pass through unchanged.
 */
export function createPrefetchingChecker(
	checker: Checker,
	sourceFile: AST.SourceFile,
): Checker {
	let symbolsByNode: Map<Node, Symbol | undefined> | undefined;

	const prefetch = (): Map<Node, Symbol | undefined> => {
		const nodes: Node[] = [];
		const collect = (node: AST.AnyNode): undefined => {
			if (isPrefetched(node)) {
				nodes.push(node);
			}
			forEachChild(node, collect);
		};
		forEachChild(sourceFile, collect);
		const symbols = checker.getSymbolAtLocation(nodes);
		return new Map(nodes.map((node, index) => [node, symbols[index]]));
	};

	function getSymbolAtLocation(node: Node): Symbol | undefined;
	function getSymbolAtLocation(nodes: readonly Node[]): (Symbol | undefined)[];
	function getSymbolAtLocation(
		nodeOrNodes: Node | readonly Node[],
	): (Symbol | undefined)[] | Symbol | undefined {
		if (Array.isArray(nodeOrNodes)) {
			return checker.getSymbolAtLocation(nodeOrNodes as readonly Node[]);
		}
		const node = nodeOrNodes as Node;
		if (
			!isPrefetched(node as AST.AnyNode) ||
			node.getSourceFile() !== sourceFile
		) {
			return checker.getSymbolAtLocation(node);
		}
		symbolsByNode ??= prefetch();
		return symbolsByNode.has(node)
			? symbolsByNode.get(node)
			: checker.getSymbolAtLocation(node);
	}

	// The checker's methods close over the checker itself rather than `this`,
	// so an object inheriting from it can override one without breaking the
	// rest, and the batched generator form can be handed over as-is.
	return Object.create(checker, {
		getSymbolAtLocation: {
			value: Object.assign(getSymbolAtLocation, {
				// eslint-disable-next-line @typescript-eslint/unbound-method
				gen: checker.getSymbolAtLocation.gen,
			}),
		},
	}) as Checker;
}

// The nodes rules and Flint itself ask for the symbols of in bulk: names,
// property accesses, and the module specifiers of imports and re-exports.
function isPrefetched(node: AST.AnyNode): boolean {
	switch (node.kind) {
		case SyntaxKind.Identifier:
		case SyntaxKind.PrivateIdentifier:
		case SyntaxKind.PropertyAccessExpression:
			return true;
		case SyntaxKind.StringLiteral:
			return (
				(node.parent.kind === SyntaxKind.ImportDeclaration ||
					node.parent.kind === SyntaxKind.ExportDeclaration) &&
				node.parent.moduleSpecifier === node
			);
		default:
			return false;
	}
}
