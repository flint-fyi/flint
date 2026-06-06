import ts from "typescript";

import type { AST } from "@flint.fyi/typescript-language";

// TODO (#2772): Fill out remaining TypeScript APIs

export const forEachChild = ts.forEachChild as unknown as <T>(
	node: AST.AnyNode,
	cbNode: (node: AST.AnyNode) => T | undefined,
	cbNodes?: (nodes: ts.NodeArray<AST.AnyNode>) => T | undefined,
) => T | undefined;
