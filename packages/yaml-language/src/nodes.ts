import type { WithExitKeys } from "@flint.fyi/core";
import type * as yaml from "yaml-unist-parser";

export type YamlNodesByName = {
	[Node in yaml.YamlUnistNode as Node["type"]]: Node;
};

export type YamlNodeVisitors = WithExitKeys<YamlNodesByName>;
