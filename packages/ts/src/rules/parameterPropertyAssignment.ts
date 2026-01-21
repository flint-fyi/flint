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
		const parameterNames = new Map<ts.Node, Set<string>>();

		const collectParameterNames = (parameters: ts.ParameterDeclaration[]) => {
			const names = new Set<string>();
			for (const parameter of parameters) {
				if (parameter.name.kind === ts.SyntaxKind.Identifier) {
					names.add(parameter.name.text);
				}
			}
			return names;
		};

		return {
			visitors: {
				ArrowFunction: (node) => {
					parameterNames.set(node, collectParameterNames(node.parameters));
				},
				BinaryExpression: (node, { sourceFile }) => {
					// Check for pattern: this.x = x (where x is a parameter)
					if (node.operatorToken.kind !== ts.SyntaxKind.EqualsToken) {
						return;
					}

					const left = node.left;
					const right = node.right;

					if (
						!ts.isPropertyAccessExpression(left) ||
						!ts.isIdentifier(left.expression) ||
						left.expression.text !== "this" ||
						!ts.isIdentifier(left.name) ||
						!ts.isIdentifier(right)
					) {
						return;
					}

					const propertyName = left.name.text;
					const parameterName = right.text;

					if (propertyName === parameterName) {
						let currentNode: ts.Node | undefined = node;
						// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
						while (currentNode !== undefined) {
							if (
								ts.isFunctionDeclaration(currentNode) ||
								ts.isFunctionExpression(currentNode) ||
								ts.isArrowFunction(currentNode)
							) {
								const params = parameterNames.get(currentNode);
								if (params?.has(parameterName)) {
									context.report({
										message: "unnecessaryParameterPropertyAssignment",
										range: getTSNodeRange(node, sourceFile),
									});
								}
								return;
							}
							currentNode = currentNode.parent;
						}
					}
				},
				FunctionDeclaration: (node) => {
					parameterNames.set(node, collectParameterNames(node.parameters));
				},
				FunctionExpression: (node) => {
					parameterNames.set(node, collectParameterNames(node.parameters));
				},
			},
		};
	},
});
