import { SyntaxKind } from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import * as AST from "../types/ast.ts";
import type { Checker } from "../types/checker.ts";
import { isGlobalDeclarationOfName } from "../utils/isGlobalDeclarationOfName.ts";

export default typescriptLanguage.createRule({
	about: {
		description:
			"Prefer Object.hasOwn() over Object.prototype.hasOwnProperty.call() for checking own properties.",
		id: "objectHasOwns",
		preset: "stylistic",
	},
	messages: {
		preferHasOwn: {
			primary:
				"`hasOwnProperty()` calls can fail on objects without `Object.prototype` or with overridden properties.",
			secondary: [
				"`Object.hasOwn()` is a more modern and safer way to check if an object has its own property.",
				"It avoids issues with objects that don't inherit from `Object.prototype` or have a modified hasOwnProperty property.",
				"`Object.hasOwn()` was introduced in ES2022 and is more concise than the hasOwnProperty alternatives.",
			],
			suggestions: [
				"Use the safer, more modern `Object.hasOwn(obj, key)`.",
				"Use an alternative key check such as the `in` operator.",
			],
		},
	},
	setup(context) {
		function isObjectPrototypeHasOwnProperty(
			node: AST.Expression,
			typeChecker: Checker,
		) {
			return (
				node.kind === SyntaxKind.PropertyAccessExpression &&
				node.name.kind === SyntaxKind.Identifier &&
				node.name.text === "prototype" &&
				node.expression.kind === SyntaxKind.Identifier &&
				isGlobalDeclarationOfName(node.expression, "Object", typeChecker)
			);
		}

		function isObjectLiteralHasOwnProperty(node: AST.Expression) {
			return (
				node.kind === SyntaxKind.ObjectLiteralExpression &&
				node.properties.length === 0
			);
		}

		function isHasOwnProperty(
			node: AST.Expression,
			typeChecker: Checker,
		): boolean {
			if (
				node.kind !== SyntaxKind.PropertyAccessExpression ||
				node.name.kind !== SyntaxKind.Identifier ||
				node.name.text !== "hasOwnProperty"
			) {
				return false;
			}

			return (
				isObjectPrototypeHasOwnProperty(node.expression, typeChecker) ||
				isObjectLiteralHasOwnProperty(node.expression)
			);
		}

		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					if (
						node.expression.kind !== SyntaxKind.PropertyAccessExpression ||
						node.expression.name.kind !== SyntaxKind.Identifier
					) {
						return;
					}

					if (
						node.expression.name.text === "call" &&
						node.arguments.length >= 2 &&
						isHasOwnProperty(node.expression.expression, typeChecker)
					) {
						context.report({
							message: "preferHasOwn",
							range: getTSNodeRange(node, sourceFile),
						});
						return;
					}

					if (
						node.expression.name.text === "hasOwnProperty" &&
						node.arguments.length >= 1 &&
						!isHasOwnProperty(node.expression, typeChecker)
					) {
						context.report({
							message: "preferHasOwn",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
			},
		};
	},
});
