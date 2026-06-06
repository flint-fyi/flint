import type { ArrayNode, ElementNode } from "@humanwhocodes/momoa";

import {
	getJsonNodeRange as getLegacyJsonNodeRange,
	type JsonSourceFile,
} from "@flint.fyi/json-language";
import { getJsonNodeRange as getNewJsonNodeRange } from "@flint.fyi/json-language/new";
import type { AST } from "@flint.fyi/typescript-language";

export function removeArrayElement(
	sourceFile: JsonSourceFile,
	element: AST.Expression,
	arrayNode: AST.ArrayLiteralExpression,
): ReturnType<typeof removeLegacyArrayElement>;
export function removeArrayElement(
	element: ElementNode,
	arrayNode: ArrayNode,
): ReturnType<typeof removeNewArrayElement>;
export function removeArrayElement(
	...parameters:
		| [ElementNode, ArrayNode]
		| [JsonSourceFile, AST.Expression, AST.ArrayLiteralExpression]
) {
	if (parameters.length === 3) {
		return removeLegacyArrayElement(...parameters);
	}

	return removeNewArrayElement(...parameters);
}

function removeLegacyArrayElement(
	sourceFile: JsonSourceFile,
	element: AST.Expression,
	arrayNode: AST.ArrayLiteralExpression,
) {
	if (arrayNode.elements.length === 1) {
		return {
			range: getLegacyJsonNodeRange(arrayNode, sourceFile),
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

function removeNewArrayElement(element: ElementNode, arrayNode: ArrayNode) {
	if (arrayNode.elements.length === 1) {
		return {
			range: getNewJsonNodeRange(arrayNode),
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
				begin: getNewJsonNodeRange(element.value).begin,
				end: getNewJsonNodeRange(next.value).begin,
			},
			text: "",
		};
	}

	if (previous) {
		return {
			range: {
				begin: getNewJsonNodeRange(previous.value).end,
				end: getNewJsonNodeRange(element.value).end,
			},
			text: "",
		};
	}

	throw new Error("Expected array element to have a sibling.");
}
