import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function isUndefinedKeyword(node: ts.Node): boolean {
	return (
		node.kind === ts.SyntaxKind.UndefinedKeyword ||
		(ts.isIdentifier(node) && node.text === "undefined")
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Disallows unnecessary explicit undefined in defaults and initializers.",
		id: "unnecessaryUndefinedDefaults",
		presets: ["logical"],
	},
	messages: {
		unnecessaryDefault: {
			primary: "Prefer omitting undefined defaults as they are implicit.",
			secondary: [
				"Variables, parameters, and destructuring patterns have undefined as their default value automatically.",
				"Explicitly specifying undefined as the default is redundant.",
			],
			suggestions: ["Remove the unnecessary undefined default value."],
		},
		unnecessaryReturn: {
			primary: "Prefer omitting undefined in return statements.",
			secondary: [
				"Functions that don't explicitly return a value implicitly return undefined.",
				"Explicitly returning undefined is unnecessary.",
			],
			suggestions: ["Use an empty return statement instead."],
		},
		unnecessaryYield: {
			primary: "Prefer omitting undefined in yield expressions.",
			secondary: [
				"Yield expressions without a value implicitly yield undefined.",
				"Explicitly yielding undefined is unnecessary.",
			],
			suggestions: ["Use yield without a value."],
		},
		unnecessaryArrowBody: {
			primary: "Prefer an empty block over returning undefined.",
			secondary: [
				"Arrow functions that don't return a value can use a block body.",
				"Explicitly returning undefined as the arrow body is unnecessary.",
			],
			suggestions: ["Replace with an empty block body."],
		},
	},
	setup(context) {
		return {
			visitors: {
				VariableStatement(node, { sourceFile }) {
					// Only flag let/var/using with undefined initializers, not const
					// const x = undefined is semantically meaningful (assigns undefined)
					// let x = undefined is redundant (undefined is the default)
					if (!(node.declarationList.flags & ts.NodeFlags.Const)) {
						for (const declaration of node.declarationList.declarations) {
							if (
								declaration.initializer &&
								isUndefinedKeyword(declaration.initializer)
							) {
								context.report({
									fix: {
										range: {
											begin: declaration.name.end,
											end: declaration.initializer.end,
										},
										text: "",
									},
									message: "unnecessaryDefault",
									range: getTSNodeRange(declaration.initializer, sourceFile),
								});
							}
						}
					}
				},
				Parameter(node, { sourceFile }) {
					if (node.initializer && isUndefinedKeyword(node.initializer)) {
						context.report({
							fix: {
								range: {
									begin: node.name.end,
									end: node.initializer.end,
								},
								text: "",
							},
							message: "unnecessaryDefault",
							range: getTSNodeRange(node.initializer, sourceFile),
						});
					}
				},
				BindingElement(node, { sourceFile }) {
					if (node.initializer && isUndefinedKeyword(node.initializer)) {
						const nameEnd = node.propertyName
							? node.propertyName.end
							: node.name.end;
						context.report({
							fix: {
								range: {
									begin: nameEnd,
									end: node.initializer.end,
								},
								text: "",
							},
							message: "unnecessaryDefault",
							range: getTSNodeRange(node.initializer, sourceFile),
						});
					}
				},
				ReturnStatement(node, { sourceFile }) {
					if (node.expression && isUndefinedKeyword(node.expression)) {
						context.report({
							fix: {
								range: {
									begin: node.getStart(sourceFile) + "return".length,
									end: node.expression.end,
								},
								text: "",
							},
							message: "unnecessaryReturn",
							range: getTSNodeRange(node.expression, sourceFile),
						});
					}
				},
				YieldExpression(node, { sourceFile }) {
					if (node.expression && isUndefinedKeyword(node.expression)) {
						context.report({
							fix: {
								range: {
									begin:
										node.getStart(sourceFile) +
										"yield".length +
										(node.asteriskToken ? 1 : 0),
									end: node.expression.end,
								},
								text: "",
							},
							message: "unnecessaryYield",
							range: getTSNodeRange(node.expression, sourceFile),
						});
					}
				},
				ArrowFunction(node, { sourceFile }) {
					if (
						node.body.kind === ts.SyntaxKind.Identifier &&
						isUndefinedKeyword(node.body)
					) {
						context.report({
							fix: {
								range: getTSNodeRange(node.body, sourceFile),
								text: "{}",
							},
							message: "unnecessaryArrowBody",
							range: getTSNodeRange(node.body, sourceFile),
						});
					}
				},
			},
		};
	},
});
