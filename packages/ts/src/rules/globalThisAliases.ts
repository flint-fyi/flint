import { SyntaxKind } from "typescript-native/unstable/ast";
import type { Program } from "typescript-native/unstable/sync";

import {
	declarationIncludesGlobal,
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type Checker,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

const globalAliases = new Set(["global", "self", "window"]);

function isOnlyGlobalDeclaration(
	node: AST.Identifier,
	typeChecker: Checker,
	program: Program,
) {
	const symbol = typeChecker.getSymbolAtLocation(node);
	if (!symbol) {
		return false;
	}

	const declarations: AST.Declaration[] = [];
	for (const declarationHandle of symbol.declarations) {
		const declaration = declarationHandle.resolve();
		if (!declaration) {
			return false;
		}
		declarations.push(declaration as AST.Declaration);
	}

	if (!declarations.length) {
		return false;
	}

	return declarations.every((declaration) =>
		declarationIncludesGlobal(declaration, program),
	);
}

function isPropertyAccess(node: AST.Identifier) {
	return (
		node.parent.kind === SyntaxKind.PropertyAccessExpression &&
		node.parent.name === node
	);
}

function isPropertyShorthand(node: AST.Identifier) {
	return (
		node.parent.kind === SyntaxKind.ShorthandPropertyAssignment &&
		node.parent.name === node
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
				Identifier: (node, { typeChecker, program, sourceFile }) => {
					if (
						globalAliases.has(node.text) &&
						!isPropertyAccess(node) &&
						!isPropertyShorthand(node) &&
						isOnlyGlobalDeclaration(node, typeChecker, program)
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
