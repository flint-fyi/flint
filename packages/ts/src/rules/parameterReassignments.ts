import {
	type AST,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function collectParameterNames(
	parameters: readonly AST.ParameterDeclaration[],
) {
	const names = new Set<string>();

	const collectNames = (node: AST.AnyNode) => {
		if (node.kind === ts.SyntaxKind.Identifier) {
			names.add((node as ts.Identifier).text);
		} else if (ts.isObjectBindingPattern(node)) {
			for (const element of node.elements) {
				if (!ts.isOmittedExpression(element)) {
					collectNames(element.name);
				}
			}
		} else if (ts.isArrayBindingPattern(node)) {
			for (const element of node.elements) {
				if (!ts.isOmittedExpression(element)) {
					collectNames(element.name);
				}
			}
		}
	};

	for (const parameter of parameters) {
		collectNames(parameter.name);
	}

	return names;
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Disallow reassignment of function parameters.",
		id: "parameterReassignments",
		presets: ["logical"],
	},
	messages: {
		parameterReassignment: {
			primary:
				"Reassigning function parameters can make them more difficult to reason about.",
			secondary: [
				"Most code treats function parameters as constants.",
				"Reassigning them inside the function removes that reference to the original value.",
				"It's generally more understandable to write code that does not modify parameters.",
			],
			suggestions: [
				"Use a new variable if you need to modify the value.",
				"Use a different pattern such as a helper function.",
			],
		},
	},
	setup(context) {
		// TODO: This will be more clean when there is a scope manager
		// https://github.com/flint-fyi/flint/issues/400
		const scopes = new Map<ts.Node, Set<string>>();

		const checkParameterAssignment = (
			name: string,
			node: AST.AnyNode,
			sourceFile: AST.SourceFile,
		) => {
			let currentNode: ts.Node | undefined = node;

			while (currentNode !== undefined) {
				if (
					ts.isFunctionDeclaration(currentNode) ||
					ts.isFunctionExpression(currentNode) ||
					ts.isArrowFunction(currentNode)
				) {
					if (scopes.get(currentNode)?.has(name)) {
						context.report({
							message: "parameterReassignment",
							range: getTSNodeRange(node, sourceFile),
						});
					}
					return;
				}

				currentNode = currentNode.parent as ts.Node | undefined;
			}
		};

		const handleUnaryExpression = (
			node: AST.PostfixUnaryExpression | AST.PrefixUnaryExpression,
			{ sourceFile }: { sourceFile: AST.SourceFile },
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
				Program: () => {
					scopes.clear();
				},
			},
		};
	},
});
