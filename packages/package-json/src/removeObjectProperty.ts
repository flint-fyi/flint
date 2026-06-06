import type { MemberNode, ObjectNode } from "@humanwhocodes/momoa";

import {
	getJsonNodeRange as getJsonNodeRangeLegacy,
	type JsonSourceFile,
} from "@flint.fyi/json-language";
import { getJsonNodeRange } from "@flint.fyi/json-language/new";
import type { AST } from "@flint.fyi/typescript-language";

export function removeObjectProperty(
	propertyNode: MemberNode,
	objectNode: ObjectNode,
) {
	if (objectNode.members.length === 1) {
		return {
			range: getJsonNodeRange(objectNode),
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

	const { begin: propertyBegin, end: propertyEnd } = getJsonNodeRange(
		propertyNode.value,
	);
	if (next) {
		const { begin: nextBegin } = getJsonNodeRange(next.value);
		return {
			range: {
				begin: propertyBegin,
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
				end: propertyEnd,
			},
			text: "",
		};
	}

	throw new Error("Expected object property to have a sibling.");
}

export function removeObjectPropertyLegacy(
	sourceFile: JsonSourceFile,
	property: AST.PropertyAssignment,
	objectNode: AST.ObjectLiteralExpression,
) {
	if (objectNode.properties.length === 1) {
		return {
			range: getJsonNodeRangeLegacy(objectNode, sourceFile),
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
