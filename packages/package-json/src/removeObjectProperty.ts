import {
	getJsonNodeRange,
	type JsonSourceFile,
} from "@flint.fyi/json-language";
import type { AST } from "@flint.fyi/typescript-language";

export function removeObjectProperty(
	sourceFile: JsonSourceFile,
	property: AST.PropertyAssignment,
	objectNode: AST.ObjectLiteralExpression,
) {
	if (objectNode.properties.length === 1) {
		return {
			range: getJsonNodeRange(objectNode, sourceFile),
			text: "{}",
		};
	}

	const index = objectNode.properties.indexOf(property);
	if (index === -1) {
		throw new Error("Node is not a child of the parent object.");
	}

	const previous = index > 0 ? objectNode.properties[index - 1] : undefined;
	const next =
		index < objectNode.properties.length - 1
			? objectNode.properties[index + 1]
			: undefined;

	if (next) {
		return {
			range: {
				begin: property.getStart(sourceFile),
				end: next.getStart(sourceFile),
			},
			text: "",
		};
	}

	if (previous) {
		return {
			range: {
				begin: previous.end,
				end: property.end,
			},
			text: "",
		};
	}

	throw new Error("Expected object property to have a sibling.");
}
