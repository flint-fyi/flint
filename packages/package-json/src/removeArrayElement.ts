import type { ArrayNode, ElementNode } from "@humanwhocodes/momoa";

import { getJsonNodeRange } from "@flint.fyi/json-language/new";

export function removeArrayElement(
	elementNode: ElementNode,
	arrayNode: ArrayNode,
) {
	if (arrayNode.elements.length === 1) {
		return {
			range: getJsonNodeRange(arrayNode),
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

	const { begin: elementBegin, end: elementEnd } = getJsonNodeRange(
		elementNode.value,
	);
	if (next) {
		const { begin: nextBegin } = getJsonNodeRange(next.value);
		return {
			range: {
				begin: elementBegin,
				end: nextBegin,
			},
			text: "",
		};
	}

	if (previous) {
		const { end: previousEnd } = getJsonNodeRange(previous.value);
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
