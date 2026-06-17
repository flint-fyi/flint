import type * as yaml from "yaml-unist-parser";

import type { WithExitKeys } from "@flint.fyi/core";

export type YamlNodesByName = {
	[Node in yaml.YamlUnistNode as Node["type"]]: Node;
};

export type YamlNodeVisitors = WithExitKeys<YamlNodesByName>;
