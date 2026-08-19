import type ts from "typescript";

import type * as AST from "../types/ast.ts";
import typescript from "../typescript.ts";

// TODO (#2772): Fill out remaining TypeScript APIs
export const forEachChild = typescript.forEachChild as unknown as <T>(
	node: AST.AnyNode,
	cbNode: (node: AST.AnyNode) => T | undefined,
	cbNodes?: (nodes: ts.NodeArray<AST.AnyNode>) => T | undefined,
) => T | undefined;
