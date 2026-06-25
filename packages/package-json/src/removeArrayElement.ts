import type { ArrayNode, ElementNode } from "@humanwhocodes/momoa";

import { getNodeRange } from "@flint.fyi/json-language";

export function removeArrayElement(
	elementNode: ElementNode,
	arrayNode: ArrayNode,
) {
	if (arrayNode.elements.length === 1) {
		return {
			range: getNodeRange(arrayNode),
			text: "[]",
		};
	}

	const index = arrayNode.elements.indexOf(elementNode);
	if (index === -1) {
		throw new Error("Node is not a child of the parent array.");
	}

	const previous = index > 0 ? arrayNode.elements[index - 1] : undefined;
	const next =
		index < arrayNode.elements.length - 1
			? arrayNode.elements[index + 1]
			: undefined;

	const { begin: elementBegin, end: elementEnd } = getNodeRange(
		elementNode.value,
	);
	if (next) {
		const { begin: nextBegin } = getNodeRange(next.value);
		return {
			range: {
				begin: elementBegin,
				end: nextBegin,
			},
			text: "",
		};
	}

	if (previous) {
		const { end: previousEnd } = getNodeRange(previous.value);
		return {
			range: {
				begin: previousEnd,
				end: elementEnd,
			},
			text: "",
		};
	}

	throw new Error("Expected array element to have a sibling.");
}
