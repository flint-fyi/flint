import * as ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";

function isArrayGenericType(node: ts.TypeReferenceNode) {
	if (!ts.isIdentifier(node.typeName)) {
		return false;
	}

	return node.typeName.text === "Array";
}

function isReadonlyArrayGenericType(node: ts.TypeReferenceNode) {
	if (!ts.isIdentifier(node.typeName)) {
		return false;
	}

	return node.typeName.text === "ReadonlyArray";
}

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports using `Array<T>` or `ReadonlyArray<T>` instead of `T[]` or `readonly T[]`.",
		id: "arrayTypes",
		presets: ["stylistic"],
	},
	messages: {
		preferArraySyntax: {
			primary: "Prefer `T[]` over `Array<T>`.",
			secondary: [
				"TypeScript provides two equivalent ways to define an array type: `T[]` and `Array<T>`.",
				"Using the shorthand `T[]` syntax consistently is more concise and idiomatic.",
			],
			suggestions: ["Replace `Array<T>` with `T[]`."],
		},
		preferReadonlyArraySyntax: {
			primary: "Prefer `readonly T[]` over `ReadonlyArray<T>`.",
			secondary: [
				"TypeScript provides two equivalent ways to define a readonly array type: `readonly T[]` and `ReadonlyArray<T>`.",
				"Using the shorthand `readonly T[]` syntax consistently is more concise and idiomatic.",
			],
			suggestions: ["Replace `ReadonlyArray<T>` with `readonly T[]`."],
		},
	},
	setup(context) {
		return {
			visitors: {
				TypeReference: (node, { sourceFile }) => {
					if (isArrayGenericType(node)) {
						context.report({
							message: "preferArraySyntax",
							range: getTSNodeRange(node, sourceFile),
						});
						return;
					}

					if (isReadonlyArrayGenericType(node)) {
						context.report({
							message: "preferReadonlyArraySyntax",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
			},
		};
	},
});
