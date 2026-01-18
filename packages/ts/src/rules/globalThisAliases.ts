import {
	type AST,
	type Checker,
	declarationIncludesGlobal,
	getTSNodeRange,
	typescriptLanguage,
} from "@flint.fyi/typescript-language";
import ts from "typescript";

import { ruleCreator } from "./ruleCreator.ts";

const globalAliases = new Set(["global", "self", "window"]);

function isOnlyGlobalDeclaration(node: AST.Identifier, typeChecker: Checker) {
	const symbol = typeChecker.getSymbolAtLocation(node);
	if (!symbol) {
		return false;
	}

	const declarations = symbol.getDeclarations();
	if (!declarations?.length) {
		return false;
	}

	return declarations.every(declarationIncludesGlobal);
}

function isPropertyAccess(node: ts.Identifier) {
	return (
		ts.isPropertyAccessExpression(node.parent) && node.parent.name === node
	);
}

function isPropertyShorthand(node: ts.Identifier) {
	return (
		ts.isShorthandPropertyAssignment(node.parent) && node.parent.name === node
	);
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Reports using window, self, or global instead of globalThis.",
		id: "globalThisAliases",
		presets: ["stylisticStrict"],
	},
	messages: {
		preferGlobalThis: {
			primary:
				"Prefer the standard `globalThis` over the platform-specific `{{ name }}` for accessing the global object.",
			secondary: [
				"`globalThis` is the standard way to access the global object across all JavaScript environments.",
				"Using `window`, `self`, or `global` ties your code to specific environments (browser, web worker, or Node.js).",
			],
			suggestions: ["Replace `{{ name }}` with `globalThis`."],
		},
	},
	setup(context) {
		return {
			visitors: {
				Identifier: (node, { sourceFile, typeChecker }) => {
					if (
						globalAliases.has(node.text) &&
						!isPropertyAccess(node) &&
						!isPropertyShorthand(node) &&
						isOnlyGlobalDeclaration(node, typeChecker)
					) {
						context.report({
							data: { name: node.text },
							message: "preferGlobalThis",
							range: getTSNodeRange(node, sourceFile),
						});
					}
				},
			},
		};
	},
});
