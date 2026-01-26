import { type AST, typescriptLanguage } from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports methods that may lose their 'this' context.",
		id: "unboundMethods",
		presets: ["logical"],
	},
	messages: {
		unboundMethod: {
			primary: "This method may lose its 'this' context.",
			secondary: [
				"Method references without binding lose their 'this' context.",
				"This can cause runtime errors when the method is called.",
			],
			suggestions: [
				"Bind the method: obj.method.bind(obj)",
				"Use an arrow function: () => obj.method()",
				"Call the method directly: obj.method()",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				PropertyAccessExpression(
					node: AST.PropertyAccessExpression,
					{ sourceFile, typeChecker },
				) {
					const parent = node.parent;

					if (ts.isCallExpression(parent) && parent.expression === node) {
						return;
					}

					if (ts.isPropertyAccessExpression(parent)) {
						return;
					}

					if (ts.isTaggedTemplateExpression(parent) && parent.tag === node) {
						return;
					}

					if (ts.isTypeOfExpression(parent)) {
						return;
					}

					if (ts.isVoidExpression(parent)) {
						return;
					}

					if (ts.isBinaryExpression(parent)) {
						const operator = parent.operatorToken.kind;
						if (
							operator === ts.SyntaxKind.EqualsEqualsToken ||
							operator === ts.SyntaxKind.EqualsEqualsEqualsToken ||
							operator === ts.SyntaxKind.ExclamationEqualsToken ||
							operator === ts.SyntaxKind.ExclamationEqualsEqualsToken ||
							operator === ts.SyntaxKind.AmpersandAmpersandToken ||
							operator === ts.SyntaxKind.BarBarToken
						) {
							return;
						}
					}

					const type = typeChecker.getTypeAtLocation(node);
					const callSignatures = type.getCallSignatures();

					if (callSignatures.length === 0) {
						return;
					}

					const objectType = typeChecker.getTypeAtLocation(node.expression);
					const symbol = objectType.getSymbol();

					if (!symbol) {
						return;
					}

					const declarations = symbol.getDeclarations();
					if (!declarations || declarations.length === 0) {
						return;
					}

					const isClassInstance = declarations.some(
						(decl) => ts.isClassDeclaration(decl) || ts.isClassExpression(decl),
					);

					if (!isClassInstance) {
						return;
					}

					const propertySymbol = typeChecker.getSymbolAtLocation(node.name);
					if (propertySymbol) {
						const propertyDeclarations = propertySymbol.getDeclarations();
						if (propertyDeclarations) {
							const isArrowFunction = propertyDeclarations.some((decl) => {
								if (ts.isPropertyDeclaration(decl) && decl.initializer) {
									return ts.isArrowFunction(decl.initializer);
								}
								return false;
							});
							if (isArrowFunction) {
								return;
							}
						}
					}

					context.report({
						message: "unboundMethod",
						range: {
							begin: node.getStart(sourceFile),
							end: node.getEnd(),
						},
					});
				},
			},
		};
	},
});
