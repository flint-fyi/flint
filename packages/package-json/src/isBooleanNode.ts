import type { ValueNode } from "@humanwhocodes/momoa";

export const isBooleanTrue = (valueNode: ValueNode): boolean =>
	valueNode.type === "Boolean" && valueNode.value;
