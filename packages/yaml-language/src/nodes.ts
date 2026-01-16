import type * as yaml from "yaml-unist-parser";

export type YamlNodesByName = {
	[Node in yaml.YamlUnistNode as Node["type"]]: Node;
};
