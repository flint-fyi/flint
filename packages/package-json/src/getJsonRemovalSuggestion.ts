import {
	getJsonNodeRange,
	type JsonSourceFile,
} from "@flint.fyi/json-language";
import type { AST } from "@flint.fyi/typescript-language";

export function getArrayElementRemovalSuggestion(
	sourceFile: JsonSourceFile,
	element: AST.Expression,
	containerNode: AST.ArrayLiteralExpression,
) {
	const index = containerNode.elements.findIndex((item) => item === element);
	const previous = index > 0 ? containerNode.elements[index - 1] : undefined;
	const next =
		index < containerNode.elements.length - 1
			? containerNode.elements[index + 1]
			: undefined;

	if (containerNode.elements.length === 1) {
		return {
			range: getJsonNodeRange(containerNode, sourceFile),
			text: "[]",
		};
	}

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

	return {
		range: {
			begin: element.getStart(sourceFile),
			end: element.end,
		},
		text: "",
	};
}

export function getObjectPropertyRemovalSuggestion(
	sourceFile: JsonSourceFile,
	property: AST.PropertyAssignment,
	properties: readonly AST.ObjectLiteralElementLike[],
) {
	const index = properties.indexOf(property);
	const previous = index > 0 ? properties[index - 1] : undefined;
	const next =
		index < properties.length - 1 ? properties[index + 1] : undefined;

	if (properties.length === 1) {
		const begin = sourceFile.text.lastIndexOf(
			"{",
			property.getStart(sourceFile),
		);
		const end = sourceFile.text.indexOf("}", property.end);

		return {
			range: {
				begin,
				end: end + 1,
			},
			text: "{}",
		};
	}

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

	return {
		range: {
			begin: property.getStart(sourceFile),
			end: property.end,
		},
		text: "",
	};
}
