import { SyntaxKind, type TypeChecker } from "typescript";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

// TODO: This will be more clean when there is a scope manager
// https://github.com/flint-fyi/flint/issues/400
function isGlobalRequire(node: AST.Expression, typeChecker: TypeChecker) {
	// TODO: Use a util like getStaticValue
	// https://github.com/flint-fyi/flint/issues/1298
	if (node.kind !== SyntaxKind.Identifier || node.text !== "require") {
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

	return declarations.every(
		(declaration) => declaration.getSourceFile().isDeclarationFile,
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description:
			"Reports CommonJS require() imports in favor of ES module imports.",
		id: "requireImports",
		presets: ["logical", "logicalStrict"],
	},
	messages: {
		noRequireImports: {
			primary:
				"Prefer ESM `import` statements over legacy CommonJS `require()` calls.",
			secondary: [
				"ESM (EcmaScript Modules) provide better static analysis, tree-shaking, and are the standard in modern JavaScript/TypeScript.",
				"CJS (CommonJS) `require()` calls are a legacy pattern that don't play as well with modern tooling.",
				"It's generally preferable in modern projects to prefer ESM over CJS.",
			],
			suggestions: [
				"Convert this CJS `require()` call to an ESM `import` statement.",
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
						node.moduleReference.kind === SyntaxKind.ExternalModuleReference
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
