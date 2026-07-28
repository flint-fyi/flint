import { SyntaxKind } from "typescript";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function getNameText(name: AST.PropertyName) {
	return name.kind === SyntaxKind.Identifier ||
		name.kind === SyntaxKind.PrivateIdentifier ||
		name.kind === SyntaxKind.StringLiteral ||
		name.kind === SyntaxKind.NumericLiteral
		? name.text
		: undefined;
}

function getNameTextIfMismatched(functionName: string, name: AST.PropertyName) {
	const nameText = getNameText(name);

	if (!nameText || nameText === functionName || !isValidIdentifier(nameText)) {
		return;
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
		presets: ["stylistic", "stylisticStrict"],
	},
	messages: {
		mismatch: {
			primary:
				"Function name `{{ functionName }}` does not match assigned name `{{ assignedName }}`.",
			secondary: [
				"When a named function expression is assigned to a variable or property, the function name should match to avoid confusion.",
			],
			suggestions: [
				"Rename the function to `{{ assignedName }}`",
				"Use an anonymous function.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				PropertyAssignment: (node, { sourceFile }) => {
					if (
						node.initializer.kind !== SyntaxKind.FunctionExpression ||
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
						node.initializer?.kind !== SyntaxKind.FunctionExpression ||
						node.name.kind !== SyntaxKind.Identifier ||
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
						node.initializer?.kind !== SyntaxKind.FunctionExpression ||
						!node.initializer.name ||
						node.name.kind !== SyntaxKind.Identifier
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
