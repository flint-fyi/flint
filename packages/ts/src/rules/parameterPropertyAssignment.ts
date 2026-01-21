import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Disallow unnecessary property assignments in function parameters.",
		id: "parameterPropertyAssignment",
		presets: ["logical"],
	},
	messages: {
		unnecessaryParameterPropertyAssignment: {
			primary: "Parameter property assignment is unnecessary.",
			secondary: [
				"Assigning a parameter property to itself is redundant.",
				"Remove the unnecessary assignment.",
			],
		},
	},
	setup(context) {
		const isFunction = (
			node: ts.Node,
		): node is
			| ts.ArrowFunction
			| ts.ConstructorDeclaration
			| ts.FunctionDeclaration
			| ts.FunctionExpression
			| ts.MethodDeclaration =>
			ts.isFunctionDeclaration(node) ||
			ts.isFunctionExpression(node) ||
			ts.isArrowFunction(node) ||
			ts.isMethodDeclaration(node) ||
			ts.isConstructorDeclaration(node);

		const hasParameter = (
			func:
				| ts.ArrowFunction
				| ts.ConstructorDeclaration
				| ts.FunctionDeclaration
				| ts.FunctionExpression
				| ts.MethodDeclaration,
			paramName: string,
		): boolean => {
			for (const param of func.parameters) {
				if (
					param.name.kind === ts.SyntaxKind.Identifier &&
					param.name.text === paramName
				) {
					return true;
				}
			}
			return false;
		};

		return {
			visitors: {
				BinaryExpression: (node, { sourceFile }) => {
					// Check for pattern: this.x = x (where x is a parameter)
					if (node.operatorToken.kind !== ts.SyntaxKind.EqualsToken) {
						return;
					}

					if (
						!ts.isPropertyAccessExpression(node.left) ||
						node.left.expression.kind !== ts.SyntaxKind.ThisKeyword ||
						!ts.isIdentifier(node.left.name) ||
						!ts.isIdentifier(node.right)
					) {
						return;
					}

					const propertyName = node.left.name.text;
					const parameterName = node.right.text;

					if (propertyName !== parameterName) {
						return;
					}

					// Walk up the parent chain to find the containing function
					let current: ts.Node | undefined = node;
					// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
					while (current !== undefined) {
						if (isFunction(current) && hasParameter(current, parameterName)) {
							// Only report for constructors and methods (not regular functions)
							if (
								ts.isConstructorDeclaration(current) ||
								ts.isMethodDeclaration(current)
							) {
								context.report({
									message: "unnecessaryParameterPropertyAssignment",
									range: getTSNodeRange(node, sourceFile),
								});
							}
							return;
						}
						current = current.parent;
					}
				},
			},
		};
	},
});
