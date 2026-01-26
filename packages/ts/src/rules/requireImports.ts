import {
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

function isGlobalRequire(node: ts.Expression, typeChecker: ts.TypeChecker) {
	if (!ts.isIdentifier(node) || node.text !== "require") {
		return false;
	}

	const symbol = typeChecker.getSymbolAtLocation(node);
	if (!symbol) {
		return true;
	}

	const declarations = symbol.getDeclarations();
	if (!declarations?.length) {
		return true;
	}

	return declarations.every((declaration) => {
		const sourceFile = declaration.getSourceFile();
		return sourceFile.isDeclarationFile;
	});
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports CommonJS require() imports in favor of ES module imports.",
		id: "requireImports",
		presets: ["logical"],
	},
	messages: {
		noRequireImports: {
			primary: "Use ES module imports instead of CommonJS require().",
			secondary: [
				"ES modules provide better static analysis, tree-shaking, and are the standard in modern JavaScript/TypeScript.",
			],
			suggestions: [
				"Convert to: import x from 'lib'",
				"Convert to: import { x } from 'lib'",
			],
		},
	},
	setup(context) {
		return {
			visitors: {
				CallExpression: (node, { sourceFile, typeChecker }) => {
					if (isGlobalRequire(node.expression, typeChecker)) {
						context.report({
							message: "noRequireImports",
							range: getTSNodeRange(node.expression, sourceFile),
						});
					}
				},
				ImportEqualsDeclaration: (node, { sourceFile }) => {
					if (
						node.moduleReference.kind === ts.SyntaxKind.ExternalModuleReference
					) {
						context.report({
							message: "noRequireImports",
							range: getTSNodeRange(node.moduleReference, sourceFile),
						});
					}
				},
			},
		};
	},
});
