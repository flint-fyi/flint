import type { WithExitKeys } from "@flint.fyi/core";

import type * as AST from "./types/ast.ts";

export type TypeScriptNodesByName = {
	[Node in AST.Node as AST.SyntaxKindNamesByKind[keyof AST.SyntaxKindNamesByKind &
		Node["kind"]]]: Node;
};

export type TypeScriptNodeVisitors = WithExitKeys<TypeScriptNodesByName>;
