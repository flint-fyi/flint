import type { ValueNode } from "@humanwhocodes/momoa";

export const isBooleanTrue = (valueNode: ValueNode): boolean => {
	return valueNode.type === "Boolean" && valueNode.value;
};
