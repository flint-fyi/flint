import type { MemberNode, ObjectNode } from "@humanwhocodes/momoa";

import { getNodeRange } from "@flint.fyi/json-language";

export function removeObjectProperty(
	propertyNode: MemberNode,
	objectNode: ObjectNode,
) {
	if (objectNode.members.length === 1) {
		return {
			range: getNodeRange(objectNode),
			text: "{}",
		};
	}

	const index = objectNode.members.indexOf(propertyNode);
	if (index === -1) {
		throw new Error("Node is not a child of the parent object.");
	}

	const previous = index > 0 ? objectNode.members[index - 1] : undefined;
	const next =
		index < objectNode.members.length - 1
			? objectNode.members[index + 1]
			: undefined;

	const { begin: propertyBegin, end: propertyEnd } = getNodeRange(propertyNode);
	if (next) {
		const { begin: nextBegin } = getNodeRange(next);
		return {
			range: {
				begin: propertyBegin,
				end: nextBegin,
			},
			text: "",
		};
	}

	if (previous) {
		const { end: previousEnd } = getNodeRange(previous);
		return {
			range: {
				begin: previousEnd,
				end: propertyEnd,
			},
			text: "",
		};
	}

	throw new Error("Expected object property to have a sibling.");
}
