import {
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import * as ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function isInTaggedTemplate(node: ts.TemplateExpression): boolean {
	return ts.isTaggedTemplateExpression(node.parent);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports template expressions with values that may produce unhelpful string output.",
		id: "templateExpressionValues",
		presets: ["logical"],
	},
	messages: {
		objectInTemplate: {
			primary:
				"Object expressions in template literals produce `[object Object]`.",
			secondary: [
				"Objects are converted to strings using their toString() method.",
				"Plain objects produce '[object Object]' which is rarely useful.",
			],
			suggestions: [
				"Use JSON.stringify() to serialize the object.",
				"Access specific properties of the object instead.",
			],
		},
		arrayInTemplate: {
			primary:
				"Array expressions in template literals may produce unexpected output.",
			secondary: [
				"Arrays are joined with commas when converted to strings.",
				"Nested arrays and objects within arrays produce '[object Object]'.",
			],
			suggestions: [
				"Use .join() with an explicit separator.",
				"Use JSON.stringify() for complex arrays.",
			],
		},
		functionInTemplate: {
			primary:
				"Function expressions in template literals produce the function source code.",
			secondary: [
				"Functions are converted to their source code when stringified.",
				"This is rarely the intended behavior.",
			],
			suggestions: ["Call the function instead of embedding it directly."],
		},
	},
	setup(context) {
		function checkTemplateSpan(
			span: ts.TemplateSpan,
			services: TypeScriptFileServices,
		) {
			const { sourceFile, typeChecker } = services;
			const expression = span.expression;

			if (ts.isObjectLiteralExpression(expression)) {
				context.report({
					message: "objectInTemplate",
					range: {
						begin: expression.getStart(sourceFile),
						end: expression.getEnd(),
					},
				});
				return;
			}

			if (ts.isArrayLiteralExpression(expression)) {
				context.report({
					message: "arrayInTemplate",
					range: {
						begin: expression.getStart(sourceFile),
						end: expression.getEnd(),
					},
				});
				return;
			}

			if (
				ts.isFunctionExpression(expression) ||
				ts.isArrowFunction(expression)
			) {
				context.report({
					message: "functionInTemplate",
					range: {
						begin: expression.getStart(sourceFile),
						end: expression.getEnd(),
					},
				});
				return;
			}

			const type = typeChecker.getTypeAtLocation(expression);
			const typeString = typeChecker.typeToString(type);

			if (
				type.flags & ts.TypeFlags.Object &&
				!(type.flags & ts.TypeFlags.String) &&
				!typeString.includes("Error") &&
				!typeString.includes("URL") &&
				!typeString.includes("Date") &&
				!typeString.includes("RegExp")
			) {
				const symbol = type.getSymbol();
				const symbolName = symbol?.getName();

				if (
					symbolName !== "String" &&
					symbolName !== "Number" &&
					symbolName !== "Boolean" &&
					symbolName !== "Error" &&
					symbolName !== "Date" &&
					symbolName !== "RegExp" &&
					symbolName !== "URL" &&
					symbolName !== "URLSearchParams"
				) {
					if (typeChecker.isArrayType(type)) {
						context.report({
							message: "arrayInTemplate",
							range: {
								begin: expression.getStart(sourceFile),
								end: expression.getEnd(),
							},
						});
					} else if (
						symbolName !== "Array" &&
						symbolName !== "Promise" &&
						!typeString.startsWith("(") &&
						!(type.getCallSignatures().length > 0)
					) {
						context.report({
							message: "objectInTemplate",
							range: {
								begin: expression.getStart(sourceFile),
								end: expression.getEnd(),
							},
						});
					}
				}
			}
		}

		return {
			visitors: {
				TemplateExpression(
					node: ts.TemplateExpression,
					services: TypeScriptFileServices,
				) {
					if (isInTaggedTemplate(node)) {
						return;
					}

					for (const span of node.templateSpans) {
						checkTemplateSpan(span, services);
					}
				},
			},
		};
	},
});
