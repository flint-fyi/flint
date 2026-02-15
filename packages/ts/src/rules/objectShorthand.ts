import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
	unwrapParenthesizedNode,
} from "@flint.fyi/typescript-language";
import ts, { SyntaxKind } from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function containsThisOrArguments(node: AST.Block): boolean {
	function visit(current: ts.Node): boolean {
		if (
			current.kind === SyntaxKind.ThisKeyword ||
			current.kind === SyntaxKind.SuperKeyword
		) {
			return true;
		}

		if (ts.isIdentifier(current) && current.text === "arguments") {
			return true;
		}

		if (
			ts.isMetaProperty(current) &&
			current.keywordToken === SyntaxKind.NewKeyword
		) {
			return true;
		}

		if (
			ts.isFunctionDeclaration(current) ||
			ts.isFunctionExpression(current) ||
			ts.isClassDeclaration(current) ||
			ts.isClassExpression(current)
		) {
			return false;
		}

		return ts.forEachChild(current, visit) ?? false;
	}

	return visit(node);
}

function getPropertyKeyText(name: AST.PropertyName) {
	switch (name.kind) {
		case SyntaxKind.ComputedPropertyName:
			if (name.expression.kind === SyntaxKind.Identifier) {
				return name.expression.text;
			}
			return undefined;

		case SyntaxKind.Identifier:
		case SyntaxKind.NoSubstitutionTemplateLiteral:
		case SyntaxKind.NumericLiteral:
		case SyntaxKind.StringLiteral:
			return name.text;

		default:
			return undefined;
	}
}

function hasAsyncModifier(
	modifiers: AST.FunctionExpression["modifiers"] | undefined,
) {
	return modifiers?.some(
		(modifier) => modifier.kind === SyntaxKind.AsyncKeyword,
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Object property and method definitions can use shorthand syntax when the key matches the value identifier or when a function expression is assigned.",
		id: "objectShorthand",
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		expectedMethodShorthand: {
			primary:
				"Function expressions in object literals can use method shorthand syntax.",
			secondary: [
				"Method shorthand syntax is more concise and clearly indicates the property is a method.",
				"Instead of `{ method: function() {} }`, use `{ method() {} }`.",
			],
			suggestions: ["Use method shorthand syntax."],
		},
		expectedPropertyShorthand: {
			primary:
				"Object properties where the key matches the value identifier can use shorthand syntax.",
			secondary: [
				"Property shorthand syntax reduces redundancy when the property name matches the variable name.",
				"Instead of `{ x: x }`, use `{ x }`.",
			],
			suggestions: ["Use property shorthand syntax."],
		},
	},
	setup(context) {
		return {
			visitors: {
				PropertyAssignment: (node, { sourceFile }) => {
					const keyText = getPropertyKeyText(node.name);
					if (keyText === undefined) {
						return;
					}

					const initializer = unwrapParenthesizedNode(node.initializer);

					switch (initializer.kind) {
						case SyntaxKind.ArrowFunction:
							if (
								initializer.body.kind === SyntaxKind.Block &&
								!hasAsyncModifier(initializer.modifiers) &&
								!containsThisOrArguments(initializer.body)
							) {
								context.report({
									message: "expectedMethodShorthand",
									range: getTSNodeRange(node, sourceFile),
								});
							}
							return;

						case SyntaxKind.FunctionExpression:
							if (!initializer.name) {
								context.report({
									message: "expectedMethodShorthand",
									range: getTSNodeRange(node, sourceFile),
								});
							}
							return;

						case SyntaxKind.Identifier:
							if (initializer.text !== keyText) {
								return;
							}

							if (
								node.name.kind === SyntaxKind.StringLiteral &&
								!isValidIdentifier(keyText)
							) {
								return;
							}

							context.report({
								message: "expectedPropertyShorthand",
								range: getTSNodeRange(node, sourceFile),
							});
							return;
					}
				},
			},
		};
	},
});

function isValidIdentifier(name: string) {
	return /^[\p{ID_Start}$_][\p{ID_Continue}$]*$/u.test(name);
}
