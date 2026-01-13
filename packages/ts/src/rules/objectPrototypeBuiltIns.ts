import { nullThrows } from "@flint.fyi/utils";
import ts, { SyntaxKind } from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import * as AST from "../types/ast.ts";

const prototypeMethods = new Set([
	"hasOwnProperty",
	"isPrototypeOf",
	"propertyIsEnumerable",
]);

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports direct calls to Object.prototype methods on object instances.",
		id: "objectPrototypeBuiltIns",
		preset: "logical",
	},
	messages: {
		prototypeBuiltIn: {
			primary:
				"Prefer the safer `Object.prototype.{{ method }}.call()` over calling `{{ method }}()` directly on objects.",
			secondary: [
				"Objects can have properties that shadow built-in methods from `Object.prototype` such as `{{ method }}()`.",
				"Objects created with `Object.create(null)` do not inherit from `Object.prototype` and will not have these methods.",
				"Calling these methods directly can fail or execute unintended code if the object has shadowing properties.",
			],
			suggestions: [
				"Call the method through `Object.prototype` using `.call()`.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile }) => {
					if (
						node.expression.kind !== SyntaxKind.PropertyAccessExpression ||
						node.expression.name.kind !== SyntaxKind.Identifier
					) {
						return;
					}

					const method = node.expression.name.text;
					if (!prototypeMethods.has(method)) {
						return;
					}

					const openParenthesisToken = findToken(
						node,
						SyntaxKind.OpenParenToken,
						sourceFile,
					);

					const closeParenthesisToken = findToken(
						node,
						SyntaxKind.CloseParenToken,
						sourceFile,
					);

					const objectText = sourceFile.text.slice(
						node.expression.expression.getStart(sourceFile),
						node.expression.expression.getEnd(),
					);

					const argumentsText = sourceFile.text.slice(
						openParenthesisToken.getEnd(),
						closeParenthesisToken.getStart(sourceFile),
					);

					context.report({
						data: { method },
						message: "prototypeBuiltIn",
						range: getTSNodeRange(node, sourceFile),
						suggestions: [
							{
								id: "usePrototypeCall",
								range: getTSNodeRange(node, sourceFile),
								text: `Object.prototype.${method}.call(${objectText}, ${argumentsText})`,
							},
						],
					});
				},
			},
		};
	},
});

function findToken(
	node: AST.CallExpression,
	token: SyntaxKind,
	sourceFile: ts.SourceFile,
) {
	return nullThrows(
		node.getChildren(sourceFile).find((child) => child.kind === token),
		"Token is expected to be present by the find call",
	);
}
