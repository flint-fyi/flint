import * as ts from "typescript";

import {
	getScopeManager,
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type Scope,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

function isInScope(accessScope: Scope, declarationScope: Scope) {
	let current: Scope | undefined = accessScope;
	while (current) {
		if (current === declarationScope) {
			return true;
		}
		current = current.upper;
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

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Use destructured variables over properties for consistency.",
		id: "destructuringConsistency",
		presets: ["stylistic", "stylisticStrict"],
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
			scope: Scope;
		}[] = [];

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

					const accessScope = getScopeManager(sourceFile).getScope(node);

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
				"SourceFile:exit"() {
					destructuredObjects.length = 0;
				},
				VariableDeclaration: (node, { sourceFile }) => {
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

					if (properties.size) {
						destructuredObjects.push({
							declarationEnd: node.getEnd(),
							destructuredProperties: properties,
							initKey,
							scope: getScopeManager(sourceFile).getScope(node),
						});
					}
				},
			},
		};
	},
});
