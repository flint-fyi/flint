import { SyntaxKind } from "typescript-native/unstable/ast";

import {
	getTSNodeRange,
	isGlobalDeclarationOfName,
	typescriptLanguage,
	type AST,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Prefer `{}` object literal notation or `Object.create` instead of calling or constructing `Object`.",
		id: "objectCalls",
		presets: ["stylistic", "stylisticStrict"],
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
			{ typeChecker, program, sourceFile }: TypeScriptFileServices,
		): void {
			if (
				node.expression.kind !== SyntaxKind.Identifier ||
				!isGlobalDeclarationOfName(
					node.expression,
					"Object",
					typeChecker,
					program,
				)
			) {
				return;
			}

			const range = getTSNodeRange(node.expression, sourceFile);
			if (node.kind === SyntaxKind.NewExpression) {
				range.begin = node.getStart(sourceFile);
				range.end = range.begin + "new".length;
			}

			context.report({
				message: "preferObjectLiteral",
				range,
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
