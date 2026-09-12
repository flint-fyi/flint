import ts, { SymbolFlags, SyntaxKind } from "typescript";
import z from "zod/v4";

import {
	getTSNodeRange,
	typescriptLanguage,
	type AST,
	type Checker,
} from "@flint.fyi/typescript-language";

import { ruleCreator } from "./ruleCreator.ts";

function isGlobalReference(node: AST.Identifier, typeChecker: Checker) {
	const symbol = ts.isShorthandPropertyAssignment(node.parent)
		? typeChecker.getShorthandAssignmentValueSymbol(node.parent)
		: typeChecker.getSymbolAtLocation(node);
	if (
		!symbol ||
		typeChecker.resolveName(node.text, node, SymbolFlags.Value, true)
	) {
		return false;
	}

	return (
		typeChecker.resolveName(node.text, node, SymbolFlags.Value, false) ===
		symbol
	);
}

function isNonReferenceName(node: AST.Identifier) {
	const parent = node.parent;
	if (ts.isPropertyAccessExpression(parent)) {
		return parent.expression !== node;
	}

	return (
		(ts.isPropertyAssignment(parent) && parent.name === node) ||
		(ts.isBindingElement(parent) && parent.propertyName === node) ||
		(ts.isLabeledStatement(parent) && parent.label === node) ||
		((ts.isBreakStatement(parent) || ts.isContinueStatement(parent)) &&
			parent.label === node) ||
		ts.isImportSpecifier(parent) ||
		ts.isExportSpecifier(parent) ||
		ts.isImportClause(parent) ||
		ts.isNamespaceImport(parent)
	);
}

function isOnlyTypeReference(node: AST.Identifier) {
	let parent: ts.Node = node.parent;
	for (;;) {
		if (ts.isTypeElement(parent)) {
			return true;
		}

		if (ts.isHeritageClause(parent)) {
			return (
				parent.token === SyntaxKind.ImplementsKeyword ||
				ts.isInterfaceDeclaration(parent.parent)
			);
		}

		if (ts.isTypeQueryNode(parent)) {
			return true;
		}

		if (ts.isTypeNode(parent) && !ts.isExpressionWithTypeArguments(parent)) {
			return true;
		}

		if (ts.isSourceFile(parent)) {
			return false;
		}

		parent = parent.parent;
	}
}

export default ruleCreator.createRule(typescriptLanguage, {
	about: {
		description: "Disallows references to specified global variables.",
		id: "restrictedGlobals",
	},
	messages: {
		restricted: {
			primary: "Global variable '{{ name }}' is restricted.",
			secondary: [
				"This global variable has been disallowed by project configuration.",
			],
			suggestions: ["Use an allowed alternative or introduce a local binding."],
		},
	},
	options: {
		deny: z
			.array(z.string())
			.default([])
			.describe(
				"Global variable names whose resolved runtime references are disallowed.",
			),
	},
	setup(context) {
		let deniedNames: Set<string> | undefined;
		return {
			visitors: {
				Identifier: (node, { options, sourceFile, typeChecker }) => {
					deniedNames ??= new Set(options.deny);
					if (
						!deniedNames.has(node.text) ||
						isNonReferenceName(node) ||
						isOnlyTypeReference(node)
					) {
						return;
					}

					if (!isGlobalReference(node, typeChecker)) {
						return;
					}

					context.report({
						data: { name: node.text },
						message: "restricted",
						range: getTSNodeRange(node, sourceFile),
					});
				},
			},
		};
	},
});
