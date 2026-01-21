import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Disallow reassignment of function parameters.",
		id: "parameterReassignments",
		presets: ["logical"],
	},
	messages: {
		parameterReassignment: {
			primary: "Do not reassign function parameters.",
			secondary: [
				"Reassigning parameters can make code harder to understand and debug.",
				"Consider using a new variable if you need to modify the value.",
			],
		},
	},
	setup(context) {
		const scopes = new Map<ts.Node, Set<string>>();

		const collectParameterNames = (parameters: ts.ParameterDeclaration[]) => {
			const names = new Set<string>();
			for (const parameter of parameters) {
				if (parameter.name.kind === ts.SyntaxKind.Identifier) {
					names.add(parameter.name.text);
				}
			}
			return names;
		};

		const checkParameterAssignment = (
			name: string,
			node: ts.Node,
			sourceFile: ts.SourceFile,
		) => {
			let currentNode: ts.Node | undefined = node;
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			while (currentNode !== undefined) {
				if (
					ts.isFunctionDeclaration(currentNode) ||
					ts.isFunctionExpression(currentNode) ||
					ts.isArrowFunction(currentNode)
				) {
					const parameterNames = scopes.get(currentNode);
					if (parameterNames?.has(name)) {
						context.report({
							message: "parameterReassignment",
							range: getTSNodeRange(node, sourceFile),
						});
					}
					return;
				}
				currentNode = currentNode.parent;
			}
		};

		const handleUnaryExpression = (
			node: ts.PostfixUnaryExpression | ts.PrefixUnaryExpression,
			{ sourceFile }: { sourceFile: ts.SourceFile },
		) => {
			if (
				(node.operator === ts.SyntaxKind.PlusPlusToken ||
					node.operator === ts.SyntaxKind.MinusMinusToken) &&
				ts.isIdentifier(node.operand)
			) {
				checkParameterAssignment(node.operand.text, node.operand, sourceFile);
			}
		};

		return {
			visitors: {
				ArrowFunction: (node) => {
					scopes.set(node, collectParameterNames(node.parameters));
				},
				BinaryExpression: (node, { sourceFile }) => {
					const isAssignment =
						node.operatorToken.kind === ts.SyntaxKind.EqualsToken ||
						node.operatorToken.kind === ts.SyntaxKind.PlusEqualsToken ||
						node.operatorToken.kind === ts.SyntaxKind.MinusEqualsToken ||
						node.operatorToken.kind === ts.SyntaxKind.AsteriskEqualsToken ||
						node.operatorToken.kind === ts.SyntaxKind.SlashEqualsToken;

					if (!isAssignment || !ts.isIdentifier(node.left)) {
						return;
					}

					checkParameterAssignment(node.left.text, node.left, sourceFile);
				},
				FunctionDeclaration: (node) => {
					scopes.set(node, collectParameterNames(node.parameters));
				},
				FunctionExpression: (node) => {
					scopes.set(node, collectParameterNames(node.parameters));
				},
				PostfixUnaryExpression: handleUnaryExpression,
				PrefixUnaryExpression: handleUnaryExpression,
			},
		};
	},
});
