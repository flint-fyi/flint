import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function getNameText(name: AST.PropertyName) {
	return ts.isIdentifier(name) ||
		ts.isPrivateIdentifier(name) ||
		ts.isStringLiteral(name) ||
		ts.isNumericLiteral(name)
		? name.text
		: undefined;
}

function getNameTextIfMismatched(functionName: string, name: AST.PropertyName) {
	const nameText = getNameText(name);

	if (!nameText || nameText === functionName || !isValidIdentifier(nameText)) {
		return undefined;
	}

	return nameText;
}

function isValidIdentifier(name: string) {
	return /^[\p{L}_$][\p{L}\d_$]*$/u.test(name);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports function names that don't match the variable or property they're assigned to.",
		id: "functionNameMatches",
		presets: ["stylistic"],
	},
	messages: {
		mismatch: {
			primary:
				"Function name `{{functionName}}` does not match assigned name `{{assignedName}}`.",
			secondary: [
				"When a named function expression is assigned to a variable or property, the function name should match to avoid confusion.",
			],
			suggestions: [
				"Rename the function to `{{assignedName}}`",
				"Use an anonymous function.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				PropertyAssignment: (node, { sourceFile }) => {
					if (
						!ts.isFunctionExpression(node.initializer) ||
						!node.initializer.name
					) {
						return;
					}

					const propertyName = getNameTextIfMismatched(
						node.initializer.name.text,
						node.name,
					);
					if (!propertyName) {
						return;
					}

					context.report({
						data: {
							assignedName: propertyName,
							functionName: node.initializer.name.text,
						},
						message: "mismatch",
						range: getTSNodeRange(node.initializer.name, sourceFile),
					});
				},
				PropertyDeclaration: (node, { sourceFile }) => {
					if (
						!node.initializer ||
						!ts.isFunctionExpression(node.initializer) ||
						node.name.kind !== ts.SyntaxKind.Identifier ||
						!node.initializer.name
					) {
						return;
					}

					const propertyName = getNameTextIfMismatched(
						node.initializer.name.text,
						node.name,
					);
					if (!propertyName) {
						return;
					}

					context.report({
						data: {
							assignedName: propertyName,
							functionName: node.initializer.name.text,
						},
						message: "mismatch",
						range: getTSNodeRange(node.initializer.name, sourceFile),
					});
				},
				VariableDeclaration: (node, { sourceFile }) => {
					if (
						!node.initializer ||
						!ts.isFunctionExpression(node.initializer) ||
						!node.initializer.name ||
						!ts.isIdentifier(node.name)
					) {
						return;
					}

					const variableName = getNameTextIfMismatched(
						node.initializer.name.text,
						node.name,
					);
					if (!variableName) {
						return;
					}

					context.report({
						data: {
							assignedName: variableName,
							functionName: node.initializer.name.text,
						},
						message: "mismatch",
						range: getTSNodeRange(node.initializer.name, sourceFile),
					});
				},
			},
		};
	},
});
