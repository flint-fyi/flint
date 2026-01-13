import ts, { SyntaxKind } from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import * as AST from "../types/ast.ts";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports unnecessary duplicate keys that override previous values.",
		id: "objectKeyDuplicates",
		preset: "untyped",
	},
	messages: {
		duplicateKey: {
			primary:
				"This key is made redundant by an identical key later in the object.",
			secondary: [
				"Duplicate object keys are legal in JavaScript, but they can lead to unexpected behavior.",
				"When duplicate keys exist, only the last value for a given key is used.",
				"This can cause confusion and bugs, especially when maintaining the code.",
			],
			suggestions: [
				"If both values are meant to exist, change one of the keys to be different.",
				"If only the last value is meant to exist, remove any prior values.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				ObjectLiteralExpression(node, { sourceFile }) {
					const seenKeys = {
						getters: new Map<string, ts.Node>(),
						setters: new Map<string, ts.Node>(),
						values: new Map<string, ts.Node>(),
					};

					for (const property of node.properties.toReversed()) {
						const key = getPropertyKeyName(property);
						if (!key) {
							continue;
						}

						const existingNode = seenKeys[key.group].get(key.text);

						if (existingNode) {
							context.report({
								message: "duplicateKey",
								range: getTSNodeRange(key.node, sourceFile),
							});
						}

						seenKeys[key.group].set(key.text, property);
					}
				},
			},
		};
	},
});

// TODO: Reuse a shared getStaticValue-style utility?
// https://github.com/flint-fyi/flint/issues/1298
function getNameText(name: AST.PropertyName) {
	if (
		name.kind === SyntaxKind.Identifier ||
		name.kind === SyntaxKind.NumericLiteral ||
		name.kind === SyntaxKind.BigIntLiteral ||
		name.kind === SyntaxKind.StringLiteral ||
		name.kind === SyntaxKind.NoSubstitutionTemplateLiteral
	) {
		return name.text;
	}

	if (name.kind === SyntaxKind.PrivateIdentifier) {
		return `#${name.text}`;
	}

	return undefined;
}

function getPropertyKeyName(property: AST.ObjectLiteralElementLike) {
	if (property.kind === SyntaxKind.ShorthandPropertyAssignment) {
		return {
			group: "values",
			node: property.name,
			text: property.name.text,
		} as const;
	}

	if (
		property.kind === SyntaxKind.PropertyAssignment ||
		property.kind === SyntaxKind.MethodDeclaration ||
		property.kind === SyntaxKind.GetAccessor ||
		property.kind === SyntaxKind.SetAccessor
	) {
		const { name } = property;
		const text = getNameText(name);
		if (!text) {
			return undefined;
		}

		const group =
			property.kind === SyntaxKind.GetAccessor
				? "getters"
				: property.kind === SyntaxKind.SetAccessor
					? "setters"
					: "values";

		return { group, node: name, text } as const;
	}

	return undefined;
}
