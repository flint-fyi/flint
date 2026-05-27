import type { WithExitKeys } from "@flint.fyi/core";
import type { CssNode } from "css-tree";

export type CssNodesByName = {
	[Node in CssNode as Node["type"]]: Node;
};

export type CssNodeVisitors = WithExitKeys<CssNodesByName>;

export type CssVisitorKey = CssNode["type"];
