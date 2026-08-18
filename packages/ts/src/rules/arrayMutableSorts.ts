import { SyntaxKind } from "typescript";

import {
	getTSNodeRange,
	isBuiltinArrayMethod,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

const methodsReturningNewArray = new Set([
	"concat",
	"entries",
	"filter",
	"flat",
	"flatMap",
	"from",
	"keys",
	"map",
	"of",
	"slice",
	"split",
	"values",
]);

const objectStaticMethods = new Set(["entries", "keys", "values"]);

function isInlineArrayCreation(node: AST.Expression): boolean {
	if (node.kind === SyntaxKind.ArrayLiteralExpression) {
		return true;
	}

	if (node.kind === SyntaxKind.ParenthesizedExpression) {
		return isInlineArrayCreation(node.expression);
	}

	if (node.kind === SyntaxKind.CallExpression) {
		if (node.expression.kind === SyntaxKind.PropertyAccessExpression) {
			const methodName = node.expression.name.text;

			if (
				node.expression.expression.kind === SyntaxKind.Identifier &&
				node.expression.expression.text === "Object" &&
				objectStaticMethods.has(methodName)
			) {
				return true;
			}

			if (
				node.expression.expression.kind === SyntaxKind.Identifier &&
				node.expression.expression.text === "Array" &&
				(methodName === "from" || methodName === "of")
			) {
				return true;
			}

			if (methodsReturningNewArray.has(methodName)) {
				return true;
			}
		}

		if (
			node.expression.kind === SyntaxKind.Identifier &&
			node.expression.text === "Array" &&
			node.parent.kind === SyntaxKind.NewExpression
		) {
			return true;
		}
	}

	if (
		node.kind === SyntaxKind.NewExpression &&
		node.expression.kind === SyntaxKind.Identifier &&
		node.expression.text === "Array"
	) {
		return true;
	}

	return false;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports `.sort()` calls on arrays that mutate the original array.",
		id: "arrayMutableSorts",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		preferToSorted: {
			primary:
				"Use `.toSorted()` instead of `.sort()` to avoid mutating the original array.",
			secondary: [
				"The `.sort()` method mutates the array in place.",
				"The `.toSorted()` method returns a new sorted array without modifying the original.",
			],
			suggestions: ["Replace `.sort()` with `.toSorted()`."],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					if (
						!isBuiltinArrayMethod("sort", node, typeChecker) ||
						isInlineArrayCreation(node.expression.expression)
					) {
						return;
					}

					const arrayText = node.expression.expression.getText(sourceFile);
					const argumentsText = node.arguments.length
						? node.arguments.map((arg) => arg.getText(sourceFile)).join(", ")
						: "";

					context.report({
						fix: {
							range: getTSNodeRange(node, sourceFile),
							text: `${arrayText}.toSorted(${argumentsText})`,
						},
						message: "preferToSorted",
						range: {
							begin: node.expression.name.getStart(sourceFile),
							end: node.getEnd(),
						},
					});
				},
			},
		};
	},
});
