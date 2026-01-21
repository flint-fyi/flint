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
		const parametersByNode = new Map<ts.Node, Set<string>>();

		const getParameterNames = (parameters: ts.ParameterDeclaration[]) => {
			const names = new Set<string>();
			for (const param of parameters) {
				if (param.name.kind === ts.SyntaxKind.Identifier) {
					names.add(param.name.text);
				}
			}
			return names;
		};

		const findContainingFunction = (node: ts.Node) => {
			let current: ts.Node | undefined = node;
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			while (current !== undefined) {
				if (
					ts.isFunctionDeclaration(current) ||
					ts.isFunctionExpression(current) ||
					ts.isArrowFunction(current) ||
					ts.isMethodDeclaration(current) ||
					ts.isConstructorDeclaration(current)
				) {
					return current;
				}
				current = current.parent;
			}
			return undefined;
		};

		return {
			visitors: {
				ArrowFunction: (
					node:
						| ts.ArrowFunction
						| ts.ConstructorDeclaration
						| ts.FunctionDeclaration
						| ts.FunctionExpression
						| ts.MethodDeclaration,
				) => {
					if (ts.isArrowFunction(node)) {
						parametersByNode.set(node, getParameterNames(node.parameters));
					}
				},
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

					const func = findContainingFunction(node);
					if (func && parametersByNode.has(func)) {
						const params = parametersByNode.get(func);
						if (params?.has(parameterName)) {
							context.report({
								message: "unnecessaryParameterPropertyAssignment",
								range: getTSNodeRange(node, sourceFile),
							});
						}
					}
				},
				ConstructorDeclaration: (
					node:
						| ts.ArrowFunction
						| ts.ConstructorDeclaration
						| ts.FunctionDeclaration
						| ts.FunctionExpression
						| ts.MethodDeclaration,
				) => {
					if (ts.isConstructorDeclaration(node)) {
						parametersByNode.set(node, getParameterNames(node.parameters));
					}
				},
				FunctionDeclaration: (
					node:
						| ts.ArrowFunction
						| ts.ConstructorDeclaration
						| ts.FunctionDeclaration
						| ts.FunctionExpression
						| ts.MethodDeclaration,
				) => {
					if (ts.isFunctionDeclaration(node)) {
						parametersByNode.set(node, getParameterNames(node.parameters));
					}
				},
				FunctionExpression: (
					node:
						| ts.ArrowFunction
						| ts.ConstructorDeclaration
						| ts.FunctionDeclaration
						| ts.FunctionExpression
						| ts.MethodDeclaration,
				) => {
					if (ts.isFunctionExpression(node)) {
						parametersByNode.set(node, getParameterNames(node.parameters));
					}
				},
				MethodDeclaration: (
					node:
						| ts.ArrowFunction
						| ts.ConstructorDeclaration
						| ts.FunctionDeclaration
						| ts.FunctionExpression
						| ts.MethodDeclaration,
				) => {
					if (ts.isMethodDeclaration(node)) {
						parametersByNode.set(node, getParameterNames(node.parameters));
					}
				},
			},
		};
	},
});
