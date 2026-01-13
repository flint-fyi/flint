import ts, { SyntaxKind } from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import {
	type TypeScriptFileServices,
	typescriptLanguage,
} from "../language.ts";
import * as AST from "../types/ast.ts";

const globalObjects = new Set(["Atomics", "JSON", "Math", "Reflect"]);

export default typescriptLanguage.createRule({
	about: {
		description:
			"Reports calling global objects like Math, JSON, or Reflect as functions.",
		id: "globalObjectCalls",
		preset: "untyped",
	},
	messages: {
		noGlobalObjectCall: {
			primary: "{{ name }} is not a function and cannot be called directly.",
			secondary: [
				"{{ name }} is a built-in global object that provides utility methods and properties.",
				"It is not a constructor or function and cannot be called or instantiated.",
			],
			suggestions: [
				"Use the static methods available on {{ name }} instead (e.g., {{ name }}.methodName()).",
			],
		},
	},
	setup(context) {
		function reportGlobalObjectCall(
			expression: AST.Expression,
			name: string,
			sourceFile: ts.SourceFile,
		): void {
			context.report({
				data: { name },
				message: "noGlobalObjectCall",
				range: getTSNodeRange(expression, sourceFile),
			});
		}

		function checkNode(
			{ expression }: AST.CallExpression | AST.NewExpression,
			{ sourceFile }: TypeScriptFileServices,
		) {
			if (
				expression.kind === SyntaxKind.Identifier &&
				globalObjects.has(expression.text)
			) {
				reportGlobalObjectCall(expression, expression.text, sourceFile);
			}
		}

		return {
			visitors: {
				CallExpression: checkNode,
				NewExpression: checkNode,
			},
		};
	},
});
