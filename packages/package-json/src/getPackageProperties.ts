import type { DocumentNode, MemberNode } from "@humanwhocodes/momoa";

export function getPackageProperties(
	rootNode: DocumentNode,
): MemberNode[] | undefined {
	const root = rootNode.body;
	if (root.type !== "Object") {
		return undefined;
	}

	return root.members;
}
