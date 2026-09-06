import { SyntaxKind } from "typescript-native/unstable/ast";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type Checker,
	type TypeScriptFileServices,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

function isImportFromNodeEvents(expression: AST.Expression): boolean {
	return (
		expression.kind === SyntaxKind.StringLiteral &&
		(expression.text === "events" || expression.text === "node:events")
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Prefer EventTarget over EventEmitter for cross-platform compatibility.",
		id: "eventClasses",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		preferEventTarget: {
			primary:
				"Prefer the cross-platform `EventTarget` over the Node.js-specific `EventEmitter`.",
			secondary: [
				"While EventEmitter is Node.js-specific, EventTarget is available in browsers, Deno, and modern Node.js.",
				"Using EventTarget makes code more portable and reduces bundle size in browser environments.",
			],
			suggestions: [
				"Replace EventEmitter with EventTarget for cross-platform event handling",
			],
		},
	},
	setup(context) {
		function isDeclarationEventEmitter(declaration: AST.AnyNode) {
			if (declaration.kind === SyntaxKind.ImportSpecifier) {
				const importedName =
					declaration.propertyName?.text ?? declaration.name.text;

				if (importedName !== "EventEmitter") {
					return false;
				}

				const importDeclaration = declaration.parent.parent
					.parent as AST.ImportDeclaration;
				if (isImportFromNodeEvents(importDeclaration.moduleSpecifier)) {
					return true;
				}
			}

			if (
				declaration.kind === SyntaxKind.ImportEqualsDeclaration &&
				declaration.name.text === "EventEmitter" &&
				declaration.moduleReference.kind ===
					SyntaxKind.ExternalModuleReference &&
				isImportFromNodeEvents(declaration.moduleReference.expression)
			) {
				return true;
			}

			return false;
		}

		function isIdentifierEventEmitter(
			identifier: AST.Identifier,
			typeChecker: Checker,
		) {
			return typeChecker
				.getSymbolAtLocation(identifier)
				?.declarations.some((declaration) => {
					const resolved = declaration.resolve() as AST.AnyNode | undefined;
					return !!resolved && isDeclarationEventEmitter(resolved);
				});
		}

		function checkExpression(
			expression: AST.Expression,
			sourceFile: AST.SourceFile,
			typeChecker: Checker,
		) {
			if (
				expression.kind === SyntaxKind.Identifier &&
				isIdentifierEventEmitter(expression, typeChecker)
			) {
				context.report({
					message: "preferEventTarget",
					range: getTSNodeRange(expression, sourceFile),
				});
			}
		}

		return {
			visitors: {
				ClassDeclaration(
					node,
					{ typeChecker, sourceFile }: TypeScriptFileServices,
				) {
					if (!node.heritageClauses) {
						return;
					}

					for (const heritageClause of node.heritageClauses) {
						if (heritageClause.token !== SyntaxKind.ExtendsKeyword) {
							continue;
						}

						for (const type of heritageClause.types) {
							if (type.kind !== SyntaxKind.ExpressionWithTypeArguments) {
								continue;
							}

							checkExpression(type.expression, sourceFile, typeChecker);
						}
					}
				},
				NewExpression(
					node,
					{ typeChecker, sourceFile }: TypeScriptFileServices,
				) {
					checkExpression(node.expression, sourceFile, typeChecker);
				},
			},
		};
	},
});
