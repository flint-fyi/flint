import type { AnyNode } from "@humanwhocodes/momoa";

import type { WithExitKeys } from "@flint.fyi/core";

export type JsonNodesByName = {
	[Node in AnyNode as Node["type"]]: Node;
};

export type JsonNodeVisitors = WithExitKeys<JsonNodesByName>;

export type JsonVisitorKey = AnyNode["type"];
