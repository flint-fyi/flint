import type { ValueNode } from "@humanwhocodes/momoa";

export function getNodeText(node: ValueNode, sourceText: string): string {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	return sourceText.slice(node.range![0], node.range![1]);
}
