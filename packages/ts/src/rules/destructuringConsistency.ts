import * as ts from "typescript";

import { getTSNodeRange } from "../getTSNodeRange.ts";
import { typescriptLanguage } from "../language.ts";
import * as AST from "../types/ast.ts";

// TODO (#400): Switch to scope analysis
function getContainingScope(node: ts.Node) {
	let current: ts.Node | undefined = node;

	while (current) {
		if (
			ts.isFunctionDeclaration(current) ||
			ts.isFunctionExpression(current) ||
			ts.isArrowFunction(current) ||
			ts.isMethodDeclaration(current) ||
			ts.isBlock(current) ||
			ts.isForStatement(current) ||
			ts.isForOfStatement(current) ||
			ts.isForInStatement(current) ||
			ts.isSourceFile(current)
		) {
			return current;
		}

		current = current.parent as ts.Node | undefined;
	}

	return undefined;
}

// TODO (#400): Switch to scope analysis
function isInScope(
	accessScope: ts.Node | undefined,
	declarationScope: ts.Node | undefined,
) {
	if (!declarationScope) {
		return true;
	}

	let current = accessScope;
	while (current) {
		if (current === declarationScope) {
			return true;
		}
		current = current.parent;
	}
	return false;
}

// TODO: Use a util like getStaticValue
// https://github.com/flint-fyi/flint/issues/1298
function getInitializerKey(node: AST.Expression): string | undefined {
	switch (node.kind) {
		case ts.SyntaxKind.Identifier:
			return node.text;

		case ts.SyntaxKind.PropertyAccessExpression: {
			if (node.questionDotToken) {
				return undefined;
			}

			const objectKey = getInitializerKey(node.expression);
			if (!objectKey) {
				return undefined;
			}

			return `${objectKey}.${node.name.text}`;
		}

		case ts.SyntaxKind.ThisKeyword:
			return "this";
	}
}

function isLeftHandSide(node: AST.AnyNode) {
	switch (node.parent.kind) {
		case ts.SyntaxKind.BinaryExpression:
			return (
				node.parent.left === node &&
				node.parent.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
				node.parent.operatorToken.kind <= ts.SyntaxKind.LastAssignment
			);

		case ts.SyntaxKind.DeleteExpression:
			return true;

		case ts.SyntaxKind.PostfixUnaryExpression:
		case ts.SyntaxKind.PrefixUnaryExpression:
			return (
				node.parent.operator === ts.SyntaxKind.PlusPlusToken ||
				node.parent.operator === ts.SyntaxKind.MinusMinusToken
			);

		default:
			return false;
	}
}

export default typescriptLanguage.createRule({
	about: {
		description: "Use destructured variables over properties for consistency.",
		id: "destructuringConsistency",
		preset: "stylistic",
	},
	messages: {
		useDestructured: {
			primary:
				"Use the destructured variable instead of accessing the property again.",
			secondary: [
				"After destructuring an object, access properties through the destructured variables.",
				"Mixing destructured variables with property access on the same object is inconsistent.",
			],
			suggestions: ["Replace `{{ expression }}` with `{{ variable }}`."],
		},
	},
	setup(context) {
		const destructuredObjects: {
			declarationEnd: number;
			destructuredProperties: Map<string, null | string>;
			initKey: string;
			scope: ts.Node | undefined;
		}[] = [];

		function collectDestructuredProperties(node: AST.VariableDeclaration) {
			if (!node.initializer || !ts.isObjectBindingPattern(node.name)) {
				return;
			}

			const initKey = getInitializerKey(node.initializer);
			if (!initKey) {
				return;
			}

			const properties = new Map<string, null | string>();
			for (const element of node.name.elements) {
				if (!ts.isBindingElement(element)) {
					continue;
				}

				if (element.propertyName) {
					if (ts.isIdentifier(element.propertyName)) {
						if (
							ts.isObjectBindingPattern(element.name) ||
							ts.isArrayBindingPattern(element.name)
						) {
							properties.set(element.propertyName.text, null);
						} else if (ts.isIdentifier(element.name)) {
							properties.set(element.propertyName.text, element.name.text);
						}
					}
				} else if (ts.isIdentifier(element.name)) {
					properties.set(element.name.text, element.name.text);
				}
			}

			if (properties.size > 0) {
				destructuredObjects.push({
					declarationEnd: node.getEnd(),
					destructuredProperties: properties,
					initKey,
					scope: getContainingScope(node),
				});
			}
		}

		return {
			visitors: {
				PropertyAccessExpression: (node, { sourceFile }) => {
					if (node.questionDotToken) {
						return;
					}

					const accessKey = getInitializerKey(node.expression);
					if (!accessKey) {
						return;
					}

					const accessScope = getContainingScope(node);

					const destructured = destructuredObjects.find(
						(object) =>
							object.initKey === accessKey &&
							node.getStart(sourceFile) >= object.declarationEnd &&
							isInScope(accessScope, object.scope),
					);

					if (!destructured) {
						return;
					}

					const propertyName = node.name.text;
					if (!destructured.destructuredProperties.has(propertyName)) {
						return;
					}

					const variableName =
						destructured.destructuredProperties.get(propertyName);

					if (
						(ts.isCallExpression(node.parent) &&
							node.parent.expression === node) ||
						isLeftHandSide(node)
					) {
						return;
					}

					const range = getTSNodeRange(node, sourceFile);
					const expression = node.getText(sourceFile);

					const [variable, suggestions] = variableName
						? [
								variableName,
								[
									{
										id: "useDestructuredVariable",
										range,
										text: variableName,
									},
								],
							]
						: [propertyName];

					context.report({
						data: { expression, variable },
						message: "useDestructured",
						range,
						suggestions,
					});
				},
				VariableDeclaration: collectDestructuredProperties,
			},
		};
	},
});
