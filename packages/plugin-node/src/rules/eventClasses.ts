import {
	type AST,
	type Checker,
	getTSNodeRange,
	type TypeScriptFileServices,
	typescriptLanguage,
} from "@flint.fyi/ts";
import ts, { SyntaxKind } from "typescript";

function isImportFromNodeEvents(
	expression: ts.Expression,
): expression is ts.StringLiteral {
	return (
		ts.isStringLiteral(expression) &&
		(expression.text === "events" || expression.text === "node:events")
	);
}

export default typescriptLanguage.createRule({
	about: {
		description:
			"Prefer EventTarget over EventEmitter for cross-platform compatibility.",
		id: "eventClasses",
		preset: "logical",
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
		function isDeclarationEventEmitter(declaration: ts.Declaration) {
			if (ts.isImportSpecifier(declaration)) {
				const importedName =
					declaration.propertyName?.text ?? declaration.name.text;

				if (importedName !== "EventEmitter") {
					return false;
				}

				if (
					declaration.parent.parent.parent.kind ===
						SyntaxKind.ImportDeclaration &&
					isImportFromNodeEvents(
						declaration.parent.parent.parent.moduleSpecifier,
					)
				) {
					return true;
				}
			}

			if (ts.isImportEqualsDeclaration(declaration)) {
				if (
					declaration.name.text === "EventEmitter" &&
					ts.isExternalModuleReference(declaration.moduleReference) &&
					isImportFromNodeEvents(declaration.moduleReference.expression)
				) {
					return true;
				}
			}

			return false;
		}

		function isIdentifierEventEmitter(
			identifier: AST.Identifier,
			typeChecker: Checker,
		) {
			return typeChecker
				.getSymbolAtLocation(identifier)
				?.getDeclarations()
				?.some(isDeclarationEventEmitter);
		}

		function checkExpression(
			expression: AST.Expression,
			sourceFile: ts.SourceFile,
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
					{ sourceFile, typeChecker }: TypeScriptFileServices,
				) {
					if (!node.heritageClauses) {
						return;
					}

					for (const heritageClause of node.heritageClauses) {
						if (heritageClause.token !== SyntaxKind.ExtendsKeyword) {
							continue;
						}

						for (const type of heritageClause.types) {
							checkExpression(type.expression, sourceFile, typeChecker);
						}
					}
				},
				NewExpression(
					node,
					{ sourceFile, typeChecker }: TypeScriptFileServices,
				) {
					checkExpression(node.expression, sourceFile, typeChecker);
				},
			},
		};
	},
});
