import ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import { ruleCreator } from "./ruleCreator.ts";

function getPropertyNameText(name: ts.PropertyName): string | undefined {
	if (ts.isIdentifier(name) || ts.isPrivateIdentifier(name)) {
		return name.text;
	}

	if (ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
		return name.text;
	}

	return undefined;
}

function isValidIdentifier(name: string): boolean {
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
				"Rename the function to `{{assignedName}}` or use an anonymous function.",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				PropertyAssignment: (node, { sourceFile }) => {
					if (!ts.isFunctionExpression(node.initializer)) {
						return;
					}

					const functionName = node.initializer.name;
					if (!functionName) {
						return;
					}

					const propertyName = getPropertyNameText(node.name);
					if (!propertyName) {
						return;
					}

					if (!isValidIdentifier(propertyName)) {
						return;
					}

					if (functionName.text !== propertyName) {
						context.report({
							data: {
								assignedName: propertyName,
								functionName: functionName.text,
							},
							message: "mismatch",
							range: getTSNodeRange(functionName, sourceFile),
						});
					}
				},

				PropertyDeclaration: (node, { sourceFile }) => {
					if (!node.initializer || !ts.isFunctionExpression(node.initializer)) {
						return;
					}

					if (ts.isPrivateIdentifier(node.name)) {
						return;
					}

					const functionName = node.initializer.name;
					if (!functionName) {
						return;
					}

					const propertyName = getPropertyNameText(node.name);
					if (!propertyName) {
						return;
					}

					if (functionName.text !== propertyName) {
						context.report({
							data: {
								assignedName: propertyName,
								functionName: functionName.text,
							},
							message: "mismatch",
							range: getTSNodeRange(functionName, sourceFile),
						});
					}
				},

				VariableDeclaration: (node, { sourceFile }) => {
					if (!node.initializer || !ts.isFunctionExpression(node.initializer)) {
						return;
					}

					const functionName = node.initializer.name;
					if (!functionName) {
						return;
					}

					if (!ts.isIdentifier(node.name)) {
						return;
					}

					const variableName = node.name.text;

					if (functionName.text !== variableName) {
						context.report({
							data: {
								assignedName: variableName,
								functionName: functionName.text,
							},
							message: "mismatch",
							range: getTSNodeRange(functionName, sourceFile),
						});
					}
				},
			},
		};
	},
});
