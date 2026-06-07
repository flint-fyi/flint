import type { ArrayNode, ElementNode } from "@humanwhocodes/momoa";

import {
	getJsonNodeRange as getJsonNodeRangeLegacy,
	type JsonSourceFile,
} from "@flint.fyi/json-language";
import { getJsonNodeRange } from "@flint.fyi/json-language/new";
import type { AST } from "@flint.fyi/typescript-language";

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

export function removeArrayElementLegacy(
	sourceFile: JsonSourceFile,
	element: AST.Expression,
	arrayNode: AST.ArrayLiteralExpression,
) {
	if (arrayNode.elements.length === 1) {
		return {
			range: getJsonNodeRangeLegacy(arrayNode, sourceFile),
			text: "[]",
		};
	}

	const index = arrayNode.elements.indexOf(element);
	if (index === -1) {
		throw new Error("Node is not a child of the parent array.");
	}

	const previous = index > 0 ? arrayNode.elements[index - 1] : undefined;
	const next =
		index < arrayNode.elements.length - 1
			? arrayNode.elements[index + 1]
			: undefined;

	if (next) {
		return {
			range: {
				begin: element.getStart(sourceFile),
				end: next.getStart(sourceFile),
			},
			text: "",
		};
	}

	if (previous) {
		return {
			range: {
				begin: previous.end,
				end: element.end,
			},
			text: "",
		};
	}

	throw new Error("Expected array element to have a sibling.");
}
