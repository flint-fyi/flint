import { getTSNodeRange } from "@flint.fyi/typescript-language";
import {
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import type { AST } from "@flint.fyi/typescript-language";
import { isGlobalDeclarationOfName } from "@flint.fyi/typescript-language";
import { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Prefer `{}` object literal notation or `Object.create` instead of calling or constructing `Object`.",
		id: "objectCalls",
		presets: ["stylistic"],
	},
	messages: {
		preferObjectLiteral: {
			primary:
				"Prefer directly using `{}` instead of calling or constructing `Object`.",
			secondary: [
				"Calling or constructing Object with `Object()` or `new Object()` is unnecessarily verbose and less idiomatic than using object literal syntax.",
				"`{}` object literal notation is the preferred and more concise way to create plain objects.",
				"For creating objects without a prototype, use `Object.create(null)`.",
			],
			suggestions: [
				"Replace `Object()` or `new Object()` with `{}` to create an empty object.",
				"Use `Object.create(null)` when you need an object without a prototype.",
			],
		},
	},
	setup(context) {
		function checkNode(
			node: AST.CallExpression | AST.NewExpression,
			{ sourceFile, typeChecker }: TypeScriptFileServices,
		): void {
			if (
				node.expression.kind != SyntaxKind.Identifier ||
				!isGlobalDeclarationOfName(node.expression, "Object", typeChecker)
			) {
				return;
			}

			const reportNode =
				node.kind === SyntaxKind.NewExpression
					? node.getChildAt(0, sourceFile)
					: node.expression;

			context.report({
				message: "preferObjectLiteral",
				range: getTSNodeRange(reportNode, sourceFile),
			});
		}

		return {
			visitors: {
				CallExpression: checkNode,
				NewExpression: checkNode,
			},
		};
	},
});
