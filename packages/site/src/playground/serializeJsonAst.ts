import type { Node } from "@humanwhocodes/momoa";

import type { PlaygroundAstNode } from "./types.ts";

export function serializeJsonAst(node: Node): PlaygroundAstNode {
	const properties: PlaygroundAstNode["properties"] = {};

	for (const [key, value] of Object.entries(node) as [string, unknown][]) {
		if (Array.isArray(value) && key !== "range") {
			properties[key] = value.filter(isNode).map(serializeJsonAst);
		} else if (isNode(value)) {
			properties[key] = serializeJsonAst(value);
		}
	}

	const [start, end] = getRange(node);

	return {
		end,
		kind: node.type,
		properties,
		start,
		...getText(node),
	};
}

// Momoa doesn't give Element nodes ranges, so they span their values.
function getRange(node: Node): [number, number] {
	if (node.range) {
		return node.range;
	}

	return "value" in node && isNode(node.value) ? getRange(node.value) : [0, 0];
}

function getText(node: Node): Pick<PlaygroundAstNode, "text"> {
	if ("name" in node && typeof node.name === "string") {
		return { text: node.name };
	}

	if (
		"value" in node &&
		(typeof node.value === "boolean" ||
			typeof node.value === "number" ||
			typeof node.value === "string")
	) {
		return { text: String(node.value) };
	}

	return {};
}

function isNode(value: unknown): value is Node {
	return typeof value === "object" && value !== null && "type" in value;
}
